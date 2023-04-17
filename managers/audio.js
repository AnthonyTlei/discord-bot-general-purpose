const { createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { EventEmitter } = require('events');
const { Song } = require('../utilities/song.js');
const Queue = require('../utilities/queue.js');

// TODO : skipToSong?
// TODO : repeatSong?
// TODO : repeatQueue?
// TODO : seek?

const AudioManagerEvents = {
	ERROR: 'error',
};

class AudioManager extends EventEmitter {
	constructor() {
		super();
		if (AudioManager.instance) {
			return AudioManager.instance;
		}
		AudioManager.instance = this;
		this.m_player = createAudioPlayer();
		this.m_queue = new Queue();
		this.m_current_song = new Song();
		this.m_player.on(AudioPlayerStatus.Idle, () => {
			this._playNextSong();
		});
		this.m_player.on('error', (error) => {
			this.emit(AudioManagerEvents.ERROR, error);
			this._playNextSong();
		});
	}

	_addToQueue(song) {
		this.m_queue.enqueue(song);
	}

	_playNextSong(count = 1) {
		for (let i = 0; i < count; i++) {
			if (this.m_queue.isEmpty) {
				this.m_player.stop();
				this.m_current_song = null;
				return;
			}
			const song = this.m_queue.dequeue();
			const resource = song.resource;
			this.m_current_song = song;
			this.m_player.play(resource);
		}
	}

	_parseQueue() {
		let reply = '';
		if (this.m_queue.isEmpty) {
			reply = 'The queue is empty.';
			return reply;
		}
		reply = 'Currently playing:\n';
		reply += `${this.m_current_song.title}\n\n`;
		reply += 'In Queue: \n';
		for (let i = 0; i < this.m_queue.length; i++) {
			reply += `${i + 1}. ${this.m_queue.get(i).title}\n`;
		}
		return reply;
	}

	play(song, callback) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			this._addToQueue(song);
			this._playNextSong();
			reply = 'Playing: ' + this.m_current_song.title;
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			this._addToQueue(song);
			reply = 'Added to queue: ' + song.title;
			break;
		}
		if (callback) {
			callback(reply);
		}
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

	playPlaylist(playlist, callback) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			for (const song of playlist) {
				this._addToQueue(song);
			}
			this._playNextSong();
			reply = 'Playing: ' + this.m_current_song.title;
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			for (const song of playlist) {
				this._addToQueue(song);
			}
			reply = 'Added to queue: ' + playlist.length + ' songs.';
			break;
		}
		if (callback) {
			callback(reply);
		}
	}

	skip(callback, count = 1) {
		let reply = '';
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			reply = 'Nothing is playing.';
			break;
		case AudioPlayerStatus.Playing:
		case AudioPlayerStatus.Paused:
		case AudioPlayerStatus.Buffering:
			this._playNextSong(count);
			if (this.m_current_song) {
				reply = 'Now playing: ' + this.m_current_song.title;
			}
			else {
				reply = 'Nothing is playing.';
			}
			break;
		}
		if (callback) {
			callback(reply);
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

	set player(player) {
		this.m_player = player;
	}

	get player() {
		return this.m_player;
	}

	get currentSong() {
		return this.m_current_song;
	}

	get queue() {
		return this.m_queue;
	}
}

module.exports = {
	AudioManager,
	AudioManagerEvents,
};
