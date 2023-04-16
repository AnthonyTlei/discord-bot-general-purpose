const { SlashCommandBuilder } = require('discord.js');

const AudioManager = require('../utilities/audio-manager.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resumes Player.'),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply(
					'You need to be in a voice channel to use this command.',
				);
				return;
			}
			await manager.resume((reply) => interaction.editReply(reply));
		}
		catch (error) {
			console.error('Error executing play command:', error);
		}
	},
};
