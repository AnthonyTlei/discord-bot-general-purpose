const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../../managers/audio.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip-to')
		.setDescription('Skips to a specific song.')
		.addStringOption((option) =>
			option
				.setName('title')
				.setDescription('The title of the song to skip to. (First exact match)')
				.setRequired(false),
		)
		.addIntegerOption((option) =>
			option
				.setName('id')
				.setDescription('The id of the song to skip to.')
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
			const id = interaction.options.getInteger('id');
			const title = interaction.options.getString('title');
			if (!id && !title) {
				await interaction.editReply('Please specify a song ID or title.');
				return;
			}
			await manager.skipTo(id, title, (reply) => interaction.editReply(reply));
		}
		catch (error) {
			console.error('Error executing skip-to command:', error);
		}
	},
};
