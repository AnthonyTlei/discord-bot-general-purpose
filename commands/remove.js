const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../managers/audio.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Removes one or more songs from queue.')
		.addIntegerOption((option) =>
			option
				.setName('id')
				.setDescription('The id of song to remove. Default: 1.')
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName('title')
				.setDescription('The title of the song(s) to remove.')
				.setRequired(false),
		)
		.addBooleanOption((option) =>
			option
				.setName('exact')
				.setDescription(
					'Whether to remove exact matches or matches containing title. Default: true',
				)
				.setRequired(false),
		)
		.addBooleanOption((option) =>
			option
				.setName('all')
				.setDescription(
					'Whether to remove all songs matching the title or the first match. Default: true',
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
			const id = interaction.options.getInteger('id');
			const title = interaction.options.getString('title');
			const exact = interaction.options.getBoolean('exact');
			const all = interaction.options.getBoolean('all');
			await manager.remove(id, title, exact, all, (reply) =>
				interaction.editReply(reply),
			);
		}
		catch (error) {
			console.error('Error executing queu command:', error);
		}
	},
};
