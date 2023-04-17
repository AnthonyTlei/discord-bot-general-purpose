const { youtubeAPIKey } = require('../config.json');
const { google } = require('googleapis');
const ytdl = require('ytdl-core-discord');

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

const getYouTubeVideoStream = async (url) => {
	try {
		return await ytdl(url, { filter: 'audioonly' });
	}
	catch (error) {
		console.error('Error getting YouTube video stream:', error);
		return null;
	}
};

module.exports = {
	getYouTubeVideoInfo,
	getYouTubeVideoStream,
};