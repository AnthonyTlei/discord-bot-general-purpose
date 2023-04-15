const { SlashCommandBuilder } = require('discord.js');
const { player } = require('../utilities/audio-player.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pauses Player.'),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply(
					'You need to be in a voice channel to use this command.',
				);
				return;
			}
			if (player.state.status === 'playing') {
				player.pause();
				await interaction.editReply('Player paused.');
			}
			else {
				await interaction.editReply('Player is not playing.');
			}
		}
		catch (error) {
			console.error('Error executing play command:', error);
		}
	},
};
