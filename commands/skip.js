const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../managers/audio.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips a song.')
		.addIntegerOption(option =>
			option.setName('count')
				.setDescription('The number times to skip.')
				.setRequired(false)),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply(
					'You need to be in a voice channel to use this command.',
				);
				return;
			}
			let count = interaction.options.getInteger('count');
			if (!count) {
				count = 1;
			}
			await manager.skip((reply) => interaction.editReply(reply), count);
		}
		catch (error) {
			console.error('Error executing skip command:', error);
		}
	},
};
