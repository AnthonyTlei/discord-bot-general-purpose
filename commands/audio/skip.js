const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../../managers/audio.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips song(s).')
		.addIntegerOption(option =>
			option.setName('count')
				.setDescription('The number of songs to skip. Default: 1')
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
			const count = interaction.options.getInteger('count');
			await manager.skip(count, (reply) => interaction.editReply(reply));
		}
		catch (error) {
			console.error('Error executing skip command:', error);
		}
	},
};
