const { createAudioPlayer } = require('@discordjs/voice');

let player = null;

if (player) {
	return;
}

player = createAudioPlayer();
player.on('error', (error) => {
	console.error('Error in audio player:', error);
	player.stop();
	// TODO : Play next song in queue if exists
});

module.exports = {
	player,
};