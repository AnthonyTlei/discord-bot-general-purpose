const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('localized-ping')
		.setDescription('Replies with localized Pong!'),
	async execute(interaction) {
		const locales = {
			fr: 'Pinge!',
			ar: 'Wle!',
		};
		await interaction.reply(locales[interaction.locale] ?? 'Ping (default is english)');
	},
};