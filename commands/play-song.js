const { SlashCommandBuilder } = require('discord.js');
const {
	joinVoiceChannel,
	createAudioResource,
	createAudioPlayer,
} = require('@discordjs/voice');
const { spotifyClientId, spotifyClientSecret } = require('../config.json');

const axios = require('axios');
const credentials = Buffer.from(
	`${spotifyClientId}:${spotifyClientSecret}`,
).toString('base64');

const getSpotifyAccessToken = async () => {
	try {
		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			'grant_type=client_credentials',
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization: `Basic ${credentials}`,
				},
			},
		);
		return response.data.access_token;
	}
	catch (error) {
		console.error('Error getting Spotify access token:', error);
		return null;
	}
}

const getSpotifyTrackInfo = async (trackId, accessToken) => {
	try {
		const response = await axios.get(
			`https://api.spotify.com/v1/tracks/${trackId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);
		return response.data;
	}
	catch (error) {
		console.error('Error getting Spotify track info:', error);
		return null;
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play-song')
		.setDescription('Plays a preview of a Spotify track.')
		.addStringOption((option) =>
			option
				.setName('link')
				.setDescription('The Link of the Spotify track to preview.')
				.setRequired(true)
				.setMaxLength(2000),
		),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply('You need to be in a voice channel to use this command.');
				return;
			}
			const link = interaction.options.getString('link');
			if (link) {
				const connection = joinVoiceChannel({
					channelId: interaction.member.voice.channelId,
					guildId: interaction.guildId,
					adapterCreator: interaction.guild.voiceAdapterCreator,
				});
				const accessToken = await getSpotifyAccessToken();
				const trackId = link.split('/').pop();
				const trackInfo = await getSpotifyTrackInfo(trackId, accessToken);
				if (!trackInfo.preview_url) {
					await interaction.editReply('No preview available for this song.');
					return;
				}
				const player = createAudioPlayer();
				const resource = createAudioResource(trackInfo.preview_url);
				player.play(resource);
				connection.subscribe(player);
				await interaction.editReply('Playing preview of: ' + trackInfo.name + ' by ' + trackInfo.artists[0].name);
			}
		}
		catch (error) {
			console.error('Error executing play-song command:', error);
			await interaction.editReply(
				'An error occurred while trying to play the song.',
			);
		}
	},
};
