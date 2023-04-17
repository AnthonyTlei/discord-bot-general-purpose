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

module.exports = {
	getSpotifyAccessToken,
	getSpotifyTrackInfo,
};