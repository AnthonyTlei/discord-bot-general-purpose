const { SlashCommandBuilder } = require('discord.js');

const { AudioManager } = require('../utilities/audio-manager.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Displays Queue information.'),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply(
					'You need to be in a voice channel to use this command.',
				);
				return;
			}
			const queue = manager.queue;
			if (queue.isEmpty) {
				await interaction.editReply('The queue is empty.');
				return;
			}
			let reply = 'Currently playing:\n';
			reply += `${manager.currentSong.title}\n\n`;
			reply += 'In Queue: \n';
			for (let i = 0; i < queue.length; i++) {
				reply += `${i + 1}. ${queue.get(i).title}\n`;
			}
			await interaction.editReply(reply);
		}
		catch (error) {
			console.error('Error executing queu command:', error);
		}
	},
};
