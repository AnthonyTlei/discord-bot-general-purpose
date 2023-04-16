const { createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const Queue = require('./queue.js');

// TODO : removeFromQueue?
// TODO : clearQueue?
// TODO : shuffleQueue?
// TODO : skipSong?
// TODO : skipToSong?
// TODO : repeatSong?
// TODO : repeatQueue?
// TODO : seek?
// TODO : Improve the Song class, add title, duration, etc.
// TODO : Implent /queue command.
// TODO : Add unique ID to every song in queue so user can remove specific song from queue.
// TODO : Find way to send messages between AudioManager and Discord, to editReply the interaction. (Maybe use a callback function?)

class AudioManager {
	constructor() {
		if (AudioManager.instance) {
			return AudioManager.instance;
		}
		AudioManager.instance = this;
		this.m_player = createAudioPlayer();
		this.m_queue = new Queue();
		this.m_player.on(AudioPlayerStatus.Idle, () => {
			this._playNextSong();
		});
	}

	_addToQueue(song) {
		console.log('_addToQueue()');
		console.log('	queue size: ' + this.m_queue.length);
		this.m_queue.enqueue(song);
		console.log('	new queue size: ' + this.m_queue.length);
	}

	_playNextSong() {
		console.log('_playNextSong()');
		if (this.m_queue.isEmpty) {
			console.log('	queue empty');
			this.m_player.stop();
			return;
		}
		console.log('	queue size: ' + this.m_queue.length);
		const song = this.m_queue.dequeue();
		console.log('	new queue size: ' + this.m_queue.length);
		const resource = song.resource;
		this.m_player.play(resource);
	}

	resume() {
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			break;
		case AudioPlayerStatus.Playing:
			break;
		case AudioPlayerStatus.Paused:
			this.m_player.unpause();
			break;
		case AudioPlayerStatus.Buffering:
			break;
		}
	}

	play(song) {
		switch (this.m_player.state.status) {
		case AudioPlayerStatus.Idle:
			this._addToQueue(song);
			this._playNextSong();
			break;
		case AudioPlayerStatus.Playing:
			this._addToQueue(song);
			break;
		case AudioPlayerStatus.Paused:
			this._addToQueue(song);
			this.m_player.unpause();
			break;
		case AudioPlayerStatus.Buffering:
			this._addToQueue(song);
			break;
		}
	}

	pause() {
		this.m_player.pause();
	}

	set player(player) {
		this.m_player = player;
	}

	get player() {
		return this.m_player;
	}
}

module.exports = AudioManager;
