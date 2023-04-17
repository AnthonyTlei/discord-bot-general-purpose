const { createAudioResource } = require('@discordjs/voice');
const { spotifyClientId, spotifyClientSecret } = require('../config.json');
const { Song } = require('./song');
const axios = require('axios');
const credentials = Buffer.from(
	`${spotifyClientId}:${spotifyClientSecret}`,
).toString('base64');

const SpotifyLinkType = {
	TRACK: 'track',
	PLAYLIST: 'playlist',
	INVALID: 'invalid',
};

const trackRegex = /^https:\/\/open\.spotify\.com\/track\/(\w{22})(\?si=[\w-]+)?$/;
const playlistRegex = /^https:\/\/open\.spotify\.com\/playlist\/(\w{22})(\?si=[\w-]+)?$/;

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
};

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
};

const validateSpotifyLink = (link) => {
	if (trackRegex.test(link)) {
		return SpotifyLinkType.TRACK;
	}
	else if (playlistRegex.test(link)) {
		return SpotifyLinkType.PLAYLIST;
	}
	else {
		return SpotifyLinkType.INVALID;
	}
};

const getSpotifyTrackId = (link) => {
	const match = trackRegex.exec(link);
	return match ? match[1] : null;
};

const createSongFromTrackInfo = (trackInfo, callback) => {
	const title = trackInfo.name;
	const artist = trackInfo.artists[0].name;
	const type = SpotifyLinkType.SPOTIFY;
	if (!trackInfo.preview_url) {
		if (callback) {
			callback('No preview available for this song.');
		}
		return null;
	}
	const resource = createAudioResource(trackInfo.preview_url);
	return new Song(resource, title, artist, type);
};

module.exports = {
	getSpotifyAccessToken,
	getSpotifyTrackInfo,
	createSongFromTrackInfo,
	validateSpotifyLink,
	SpotifyLinkType,
	getSpotifyTrackId,
};