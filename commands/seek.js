const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../managers/audio.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('seek')
		.setDescription('Starts the audio from a specific point.')
		.addIntegerOption(option =>
			option.setName('seconds')
				.setDescription('Where to start playing the audio from.')
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
			const seconds = interaction.options.getInteger('seconds');
			await manager.seek(seconds, (reply) => interaction.editReply(reply));
		}
		catch (error) {
			console.error('Error executing seek command:', error);
		}
	},
};
