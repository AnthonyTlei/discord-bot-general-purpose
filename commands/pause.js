const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../managers/audio.js');
const manager = new AudioManager();

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
			await manager.pause((reply) => interaction.editReply(reply));
		}
		catch (error) {
			console.error('Error executing pause command:', error);
		}
	},
};
