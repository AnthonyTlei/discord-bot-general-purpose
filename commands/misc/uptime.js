const { SlashCommandBuilder } = require('discord.js');
const { getUptime, formatTime } = require('../../utilities/clock');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('uptime')
		.setDescription('Displays how long the bot has been up for.'),
	async execute(interaction) {
		const uptime = getUptime();
		const result = formatTime(uptime);
		await interaction.reply(`System has been awake for ${result}s.`);
	},
};