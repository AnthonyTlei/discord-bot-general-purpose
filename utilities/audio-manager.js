const { createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const Queue = require('./queue.js');
const { Song } = require('./song.js');

// TODO : removeFromQueue?
// TODO : clearQueue?
// TODO : shuffleQueue?
// TODO : skipSong?
// TODO : skipToSong?
// TODO : repeatSong?
// TODO : repeatQueue?
// TODO : seek?
// TODO : Implent /queue command.
// TODO : Add unique ID to every song in queue so user can remove specific song from queue.

class AudioManager {
	constructor() {
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
			// TODO : Emit signal to send message to user?
			console.error('Error in AudioManager:', error);
			this._playNextSong();
		});
	}

	_addToQueue(song) {
		this.m_queue.enqueue(song);
	}

	_playNextSong() {
		if (this.m_queue.isEmpty) {
			this.m_player.stop();
			return;
		}
		const song = this.m_queue.dequeue();
		const resource = song.resource;
		this.m_current_song = song;
		this.m_player.play(resource);
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
		this.m_player.pause();
		if (callback) {
			callback('Paused: ' + this.m_current_song.title);
		}
	}

	set player(player) {
		this.m_player = player;
	}

	get player() {
		return this.m_player;
	}
}

module.exports = AudioManager;
