const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../managers/audio.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('repeat')
		.setDescription('Stops the Audio Player, clears the queue.')
		.addBooleanOption((option) =>
			option
				.setName('song')
				.setDescription(
					'Whether to repeat currently playing song. Default: false',
				)
				.setRequired(false),
		),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply(
					'You need to be in a voice channel to use this command.',
				);
				return;
			}
			const repeatSong = interaction.options.getBoolean('song');
			if (repeatSong !== null) {
				manager.repeatSong = repeatSong;
			}
			const reply = 'Repeat Song: ' + manager.repeatSong;
			await interaction.editReply(reply);
		}
		catch (error) {
			console.error('Error executing repeat command:', error);
		}
	},
};
