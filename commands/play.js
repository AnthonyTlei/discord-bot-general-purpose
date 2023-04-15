const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { youtubeAPIKey } = require('../config.json');
const ytdl = require('ytdl-core-discord');
const { google } = require('googleapis');

const youtube = google.youtube({
	version: 'v3',
	auth: youtubeAPIKey,
});

const getYouTubeVideoInfo = async (query) => {
	try {
		const response = await youtube.search.list({
			part: 'snippet',
			q: query,
			type: 'video',
			maxResults: 1,
		});
		return response.data.items[0];
	}
	catch (error) {
		console.error('Error getting YouTube video info:', error);
		return null;
	}
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a song.')
		.addStringOption((option) =>
			option
				.setName('query')
				.setDescription('The query to search for.')
				.setRequired(true)
				.setMaxLength(2000),
		),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply(
					'You need to be in a voice channel to use this command.',
				);
				return;
			}
			const query = interaction.options.getString('query');
			if (query) {
				const connection = joinVoiceChannel({
					channelId: interaction.member.voice.channelId,
					guildId: interaction.guildId,
					adapterCreator: interaction.guild.voiceAdapterCreator,
				});
				const video = await getYouTubeVideoInfo(query);
				if (!video) {
					await interaction.editReply('Song not found.');
					return;
				}
				const url = `https://www.youtube.com/watch?v=${video.id.videoId}`;
				const stream = await ytdl(url, { filter: 'audioonly' });
				const player = createAudioPlayer();
				const resource = createAudioResource(stream);
				player.play(resource);
				connection.subscribe(player);
				await interaction.editReply('Playing: ' + video.snippet.title);
			}
		}
		catch (error) {
			console.error('Error executing play command:', error);
			await interaction.editReply(
				'An error occurred while trying to play the song.',
			);
		}
	},
};
