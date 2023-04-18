const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../managers/audio.js');
const manager = new AudioManager();

// TODO: add skipTo ID.

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip-to')
		.setDescription('Skips to a song.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('The title of the song to skip to. (First exact match)')
				.setRequired(true)),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply(
					'You need to be in a voice channel to use this command.',
				);
				return;
			}
			const title = interaction.options.getString('title');
			await manager.skipTo(title, (reply) => interaction.editReply(reply));
		}
		catch (error) {
			console.error('Error executing skip command:', error);
		}
	},
};
