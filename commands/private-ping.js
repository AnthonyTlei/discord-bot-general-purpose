const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('private-ping')
		.setDescription('Replies privately with Secret Pong!'),
	async execute(interaction) {
		await interaction.reply({ content: 'Pong!', ephemeral: true });
		await wait(2000);
		await interaction.editReply('Secret Pong!');
	},
};