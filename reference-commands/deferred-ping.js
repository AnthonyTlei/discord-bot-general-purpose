const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deferred-ping')
		.setDescription('Replies with Pong! after thinking for 5 seconds'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		await wait(5000);
		await interaction.editReply('Pong!');
	},
};