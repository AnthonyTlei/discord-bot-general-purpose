const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Replies with your input!')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('The input to echo back')
				.setRequired(true)
				.setMaxLength(2000))
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to echo into')
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption(option =>
			option.setName('ephemeral')
				.setDescription('Whether or not the echo should be ephemeral')),
	async execute(interaction) {
		const message = interaction.options.getString('input');
		const channel = interaction.options.getChannel('channel');
		const ephemeral = interaction.options.getBoolean('ephemeral');
		if (message) {
			if (channel) {
				await channel.send({ content: message });
				await interaction.reply({ content: `Message Echoed to ${channel.name}`, ephemeral: ephemeral });
			}
			else {
				await interaction.reply({ content: message, ephemeral: ephemeral });
			}
		}
	},
};