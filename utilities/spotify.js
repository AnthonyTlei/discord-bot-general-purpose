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

const trackRegex =
  /^https:\/\/open\.spotify\.com\/track\/(\w{22})(\?si=[\w-]+)?$/;
const playlistRegex =
  /^https:\/\/open\.spotify\.com\/playlist\/(\w{22})(\?si=[\w-]+)?$/;

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

const getSpotifyPlaylistInfo = async (playlistId, accessToken) => {
	try {
		const response = await axios.get(
			`https://api.spotify.com/v1/playlists/${playlistId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);
		return response.data;
	}
	catch (error) {
		console.error('Error getting Spotify playlist info:', error);
		return null;
	}
};

const validateSpotifyUrl = (link) => {
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

const getSpotifyPlaylistId = (link) => {
	const match = playlistRegex.exec(link);
	return match ? match[1] : null;
};

const createSongFromTrackInfo = (trackInfo) => {
	if (!trackInfo) {
		throw new Error('Song not found');
	}
	if (!trackInfo.preview_url) {
		throw new Error('No preview available for this song.');
	}
	const title = trackInfo.name;
	const artist = trackInfo.artists[0].name;
	const type = SpotifyLinkType.SPOTIFY;
	const url = trackInfo.preview_url;
	const resource = createAudioResource(trackInfo.preview_url);
	return new Song(resource, title, artist, url, type);
};

module.exports = {
	createSongFromTrackInfo,
	getSpotifyAccessToken,
	getSpotifyPlaylistInfo,
	getSpotifyPlaylistId,
	getSpotifyTrackId,
	getSpotifyTrackInfo,
	SpotifyLinkType,
	validateSpotifyUrl,
};
