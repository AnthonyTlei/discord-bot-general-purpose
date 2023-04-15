const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('followup-ping')
		.setDescription('Replies privately with Pong! Twice.'),
	async execute(interaction) {
		await interaction.reply({ content: 'Pong!', ephemeral: true });
		await wait(1000);
		await interaction.followUp({ content: 'Pong again!', ephemeral: true });
	},
};