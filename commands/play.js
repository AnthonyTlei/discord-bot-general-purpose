const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioResource } = require('@discordjs/voice');
const { youtubeAPIKey } = require('../config.json');
const { google } = require('googleapis');
const ytdl = require('ytdl-core-discord');

const AudioManager = require('../utilities/audio-manager.js');
const Song = require('../utilities/song.js');

const manager = new AudioManager();

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
				.setRequired(false)
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
			const connection = joinVoiceChannel({
				channelId: interaction.member.voice.channelId,
				guildId: interaction.guildId,
				adapterCreator: interaction.guild.voiceAdapterCreator,
			});
			if (!connection) {
				await interaction.editReply('Failed to join voice channel.');
				return;
			}
			const query = interaction.options.getString('query');
			if (query) {
				const video = await getYouTubeVideoInfo(query);
				if (!video) {
					await interaction.editReply('Song not found.');
					return;
				}
				const url = `https://www.youtube.com/watch?v=${video.id.videoId}`;
				const stream = await ytdl(url, { filter: 'audioonly' });
				const resource = createAudioResource(stream);
				const song = new Song(resource);
				manager.addToQueue(song);
				connection.subscribe(manager.player);
				await interaction.editReply('Playing: ' + video.snippet.title);
			}
			else {
				manager.resume();
				await interaction.editReply('Resuming song.');
			}
		}
		catch (error) {
			console.error('Error executing play command:', error);
		}
	},
};
