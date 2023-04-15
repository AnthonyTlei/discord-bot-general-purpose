const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('repong-ping')
		.setDescription('Replies privately with Pong! Deletes it, then replies with Re-Pong!'),
	async execute(interaction) {
		await interaction.reply({ content: 'Pong!', ephemeral: true });
		await wait(1000);
		const message = await interaction.fetchReply();
		await interaction.deleteReply();
		await interaction.followUp({ content: `Re-${message}`, ephemeral: true });
	},
};