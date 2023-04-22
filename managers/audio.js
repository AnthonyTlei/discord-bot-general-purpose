const { createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { EventEmitter } = require('events');
const { getLyrics } = require('../utilities/genius.js');
const Queue = require('../utilities/queue.js');
const {
	createResourceFromURL,
	getYTVideoInfoFromQuery,
	createSongFromVideoInfo,
	getYTVideoInfoFromURL,
	validateYouTubeUrl,
	YouTubeLinkType,
} = require('../utilities/youtube.js');
const {
	getSpotifyTrackInfo,
	getSpotifyTrackId,
	getSpotifyAccessToken,
	createSongFromTrackInfo,
	SpotifyLinkType,
	validateSpotifyUrl,
	getSpotifyPlaylistInfo,
	getSpotifyPlaylistId,
} = require('../utilities/spotify.js');
const AudioManagerEvents = {
	ERROR: 'error',
};

const Source = {
	YOUTUBE: 'youtube',
	SPOTIFY: 'spotify',
	UNKNOWN: 'unknown',
};
class AudioManager extends EventEmitter {
	constructor() {
		super();
		if (AudioManager.instance) {
			return AudioManager.instance;
		}
		AudioManager.instance = this;
		this._start();
	}

	_start() {
		this.m_player = createAudioPlayer();
		this.m_queue = new Queue();
		this.m_current_song = null;
		this.m_start_time = 0;
		this.m_last_seek = 0;
		this.m_repeat_song = false;
		this.m_player.on(AudioPlayerStatus.Idle, async () => {
			await this._playNextSong();
		});
		this.m_player.on('error', async (error) => {
			this.emit(AudioManagerEvents.ERROR, error);
			await this._playNextSong();
		});
	}

	_addToQueue(songs) {
		for (const song of songs) {
			this.m_queue.enqueue(song);
		}
	}

	_createResource(url, options = {}) {
		return createResourceFromURL(url, options);
	}

	_play(resource) {
		this.m_player.play(resource);
	}

	_parseQueue() {
		let reply = '';
		if (!this.m_current_song) {
			reply = 'No song is currently playing.';
			return reply;
		}
		reply = 'Currently playing:\n';
		reply += `${this.m_current_song.title}\n\n`;
		reply += 'Repeat Song: ' + this.m_repeat_song + '\n\n';
		if (this.m_queue.isEmpty) {
			reply = 'The queue is empty.';
			return reply;
		}
		reply += 'In Queue: \n';
		for (let i = 0; i < this.m_queue.length; i++) {
			reply += `${i + 1}. ${this.m_queue.get(i).title}\n`;
		}
		return reply;
	}

	_calculateElapsedTime(offset) {
		if (!this.m_current_song || !this.m_start_time) {
			return 0;
		}
		const now = Date.now();
		const elapsedTime = (now - this.m_start_time) / 1000 + offset;
		return elapsedTime;
	}

	_getNextSongInfo(count = 1) {
		if (this.m_repeat_song) {
			return this.m_current_song;
		}
		if (this.m_queue.isEmpty) {
			return null;
		}
		const song = this.m_queue.get(count - 1);
		return song;
	}

	_validateSource(url) {
		const youtubeUrlType = validateYouTubeUrl(url);
		const spotifyUrlType = validateSpotifyUrl(url);
		if (youtubeUrlType !== YouTubeLinkType.INVALID) {
			return Source.YOUTUBE;
		}
		else if (spotifyUrlType !== SpotifyLinkType.INVALID) {
			return Source.SPOTIFY;
		}
		else {
			return Source.UNKNOWN;
		}
	}

	async _playAsync(resource) {
		return new Promise((resolve, reject) => {
			this._play(resource);
			this.m_player.on(AudioPlayerStatus.Idle, () => {
				resolve(AudioPlayerStatus.Idle);
			});
			this.m_player.on(AudioPlayerStatus.Playing, () => {
				resolve(AudioPlayerStatus.Playing);
			});
			// TODO : Consider implementing a timeout later on for Buffering time.
			this.m_player.on('error', (error) => {
				reject(error);
			});
		});
	}

	async _playNextSong(count = 1) {
		this.m_last_seek = 0;
		if (this.m_repeat_song) {
			const url = this.m_current_song.url;
			const options = {};
			const resource = await this._createResource(url, options);
			await this._playAsync(resource);
			this.m_start_time = Date.now();
			return;
		}
		let song = null;
		for (let i = 0; i < count; i++) {
			if (this.m_queue.isEmpty) {
				this.m_player.stop();
				this.m_current_song = null;
				return;
			}
			song = this.m_queue.dequeue();
		}
		const resource = song.resource;
		this.m_current_song = song;
		await this._playAsync(resource);
		this.m_start_time = Date.now();
	}

	async _spotifyFactory(trackInfo) {
		const song = await createSongFromTrackInfo(trackInfo);
		return song;
	}

	async _youtubeFactory(trackInfo) {
		const query = trackInfo.name + ' ' + trackInfo.artists[0].name;
		const songId = trackInfo.id;
		const video = await getYTVideoInfoFromQuery({ query, songId });
		const song = await createSongFromVideoInfo(video);
		return song;
	}

	async _getSpotifySongs(url, songFactory) {
		let songs = [];
		const urlType = validateSpotifyUrl(url);
		const accessToken = await getSpotifyAccessToken();
		if (urlType === SpotifyLinkType.INVALID) {
			throw new Error('Invalid Spotify link.');
		}
		if (urlType === SpotifyLinkType.TRACK) {
			const trackId = getSpotifyTrackId(url);
			const trackInfo = await getSpotifyTrackInfo(trackId, accessToken);
			const song = await songFactory(trackInfo);
			songs.push(song);
		}
		else if (urlType === SpotifyLinkType.PLAYLIST) {
			const playlistId = getSpotifyPlaylistId(url);
			const playlistInfo = await getSpotifyPlaylistInfo(
				playlistId,
				accessToken,
			);
			if (!playlistInfo) {
				throw new Error('Error getting playlist info.');
			}
			songs = await Promise.all(
				playlistInfo.tracks.items.map(async (item) => {
					const song = await songFactory(item.track);
					return song;
				}),
			);
			if (!songs) {
				return;
			}
		}
		else if (urlType === SpotifyLinkType.ALBUM) {
			// TODO: Implement Album support.
			throw new Error('Albums are yet to be implemented.');
		}
		return songs;
	}

	async _getYoutubeSongs({ query = '', url }) {
		const songs = [];
		let video = null;
		if (url) {
			const type = validateYouTubeUrl(url);
			switch (type) {
			case YouTubeLinkType.VIDEO:
				video = await getYTVideoInfoFromURL(url);
				break;
			case YouTubeLinkType.PLAYLIST:
				// TODO: Implement Playlist support.
				throw new Error('Youtube Playlists are yet to be implemented.');
			case YouTubeLinkType.INVALID:
				throw new Error('Invalid YouTube link.');
			}
		}
		else if (query) {
			video = await getYTVideoInfoFromQuery(query);
		}
		if (!video) {
			throw Error('Song not found.');
		}
		const song = await createSongFromVideoInfo(video);
		songs.push(song);
		return songs;
	}

	async play({
		url,
		query = '',
		preview = false,
		callback = null,
		...otherOptions
	}) {
		let reply = '';
		let songs = [];
		if (preview) {
			try {
				songs = await this._getSpotifySongs(url, this._spotifyFactory);
			}
			catch (error) {
				console.error('Error:', error.message);
				if (callback) {
					callback(error.message);
				}
				return;
			}
		}
		else {
			try {
				if (url) {
					const source = this._validateSource(url);
					if (source === Source.YOUTUBE) {
						songs = await this._getYoutubeSongs({ url });
					}
					else if (source === Source.SPOTIFY) {
						songs = await this._getSpotifySongs(url, this._youtubeFactory);
					}
					else {
						throw new Error('Invalid URL.');
					}
				}
				else if (query) {
					songs = await this._getYoutubeSongs({ query });
				}
				else {
					throw new Error('No URL or query provided.');
				}
			}
			catch (error) {
				if (callback) {
					callback(error.message);
				}
				return;
			}
		}
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			this._addToQueue(songs);
			await this._playNextSong();
			reply = 'Playing: ' + this.m_current_song.title;
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			this._addToQueue(songs);
			if (songs.length === 1) {
				reply = 'Added to queue: ' + songs[0].title;
			}
			else {
				reply = 'Added to queue: ' + songs.length + ' songs.';
			}
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	async playSongs(songs, callback) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			this._addToQueue(songs);
			await this._playNextSong();
			reply = 'Playing: ' + this.m_current_song.title;
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			this._addToQueue(songs);
			reply = 'Added to queue: ' + songs.length + ' songs.';
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	async skip(count, callback) {
		let reply = '';
		let nextSong = null;
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			if (!count) {
				count = 1;
			}
			nextSong = this._getNextSongInfo(count);
			if (nextSong) {
				reply = 'Now playing: ' + nextSong.title;
			}
			else {
				reply = 'Nothing is playing.';
			}
			if (callback) {
				callback(reply);
			}
			await this._playNextSong(count);
			break;
		}
	}

	async skipTo(id, title, callback) {
		let reply = '';
		let songs = [];
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			if (id) {
				this.skip(id, callback);
				return;
			}
			if (title) {
				songs = this.m_queue.search(title, true, true);
				if (songs.length == 0) {
					reply = 'Song not in queue.';
				}
				else {
					const nextSong = this._getNextSongInfo(
						this.m_queue.indexOfFirst(songs[0]) + 1,
					);
					if (nextSong) {
						reply = 'Now playing: ' + nextSong.title;
					}
					else {
						reply = 'Nothing is playing.';
					}
					if (callback) {
						callback(reply);
					}
					await this._playNextSong(this.m_queue.indexOfFirst(songs[0]) + 1);
				}
				break;
			}
		}
	}

	async seek(time, callback) {
		let reply = '';
		let resource = null;
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			this.m_last_seek = time;
			this.m_start_time = Date.now();
			resource = await this._createResource(this.m_current_song.url, {
				seek: time,
			});
			await this._playAsync(resource);
			reply =
          'Playing: ' + this.m_current_song.title + ' at ' + time + ' seconds.';
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	async lyrics() {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			if (this.m_current_song) {
				reply = 'Lyrics for: ' + this.m_current_song.title + '\n\n';
				reply += await getLyrics(this.m_current_song);
			}
			else {
				reply = 'Nothing is playing.';
			}
		}
		return reply;
	}

	remove(id, title, exact, all, callback) {
		let reply = '';
		if (this.m_queue.isEmpty) {
			reply = 'The queue is empty.';
			if (callback) {
				callback(reply);
			}
			return;
		}
		if (id) {
			const song = this.m_queue.remove(id - 1);
			if (song) {
				reply = 'Removed: ' + song.title;
			}
			else {
				reply = 'No song found with that ID.';
			}
			if (callback) {
				callback(reply);
			}
			return;
		}
		else if (title) {
			const songs = this.m_queue.removeByQuery(title, exact, all);
			if (songs.length == 1) {
				reply = 'Removed: ' + songs[0].title;
			}
			else if (songs.length > 1) {
				reply = 'Removed: \n';
				for (const song of songs) {
					reply += song.title + '\n';
				}
			}
			else {
				reply = 'No songs removed.';
			}
			if (callback) {
				callback(reply);
			}
			return;
		}
		else {
			const song = this.m_queue.remove(0);
			reply = 'Removed: ' + song.title;
			if (callback) {
				callback(reply);
			}
			return;
		}
	}

	resume(callback) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
			reply = 'Already playing: ' + this.m_current_song.title;
			break;
		case AudioPlayerStatus.Paused:
			this.m_player.unpause();
			reply = 'Resumed: ' + this.m_current_song.title;
			break;
		case AudioPlayerStatus.Buffering:
			reply = 'Buffering: ' + this.m_current_song.title;
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	pause(callback) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
			this.m_player.pause();
			reply = 'Paused: ' + this.m_current_song.title;
			break;
		case AudioPlayerStatus.Paused:
			reply = 'Player is already paused.';
			break;
		case AudioPlayerStatus.Buffering:
			reply = 'Buffering: ' + this.m_current_song.title;
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	stop(callback) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			this.m_player.stop();
			this.m_queue.clear();
			this.m_current_song = null;
			reply = 'Stopped.';
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	clear(callback) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			if (this.m_queue.isEmpty) {
				reply = 'Queue is already empty.';
				break;
			}
			this.m_queue.clear();
			reply = 'Cleared Queue.';
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	shuffle(callback) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			if (this.m_queue.isEmpty) {
				reply = 'Queue is empty.';
				break;
			}
			this.m_queue.shuffle();
			reply += this._parseQueue();
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	getSongInfo() {
		let reply = '';
		const elapsed = this._calculateElapsedTime(this.m_last_seek);
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			if (this.m_current_song) {
				reply = 'Title: ' + this.m_current_song.title + '\n';
				reply += 'Artist: ' + this.m_current_song.artist + '\n';
				reply += 'Time elapsed: ' + elapsed + ' seconds.' + '\n';
			}
			else {
				reply = 'Nothing is playing.';
			}
			break;
		}
		return reply;
	}

	set player(player) {
		this.m_player = player;
	}

	set repeatSong(bool) {
		this.m_repeat_song = bool;
	}

	get player() {
		return this.m_player;
	}

	get currentSong() {
		return this.m_current_song;
	}

	get repeatSong() {
		return this.m_repeat_song;
	}

	get queue() {
		return this.m_queue;
	}
}

module.exports = {
	AudioManager,
	AudioManagerEvents,
};
