const { createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { EventEmitter } = require('events');
const { Song } = require('./song.js');
const Queue = require('./queue.js');

// TODO : removeFromQueue?
// TODO : clearQueue?
// TODO : shuffleQueue?
// TODO : skipToSong?
// TODO : repeatSong?
// TODO : repeatQueue?
// TODO : seek?
// TODO : Implent /queue command.
// TODO : Add unique ID to every song in queue so user can remove specific song from queue.

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

	set player(player) {
		this.m_player = player;
	}

	get player() {
		return this.m_player;
	}
}

module.exports = {
	AudioManager,
	AudioManagerEvents,
};
