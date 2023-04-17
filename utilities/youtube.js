const { createAudioResource } = require('@discordjs/voice');
const { youtubeAPIKey } = require('../config.json');
const { google } = require('googleapis');
const { Song, SongType } = require('./song');
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

const createSongFromVideo = async (video) => {
	try {
		const title = video.snippet.title;
		const artist = video.snippet.channelTitle;
		const type = SongType.YOUTUBE;
		const url = `https://www.youtube.com/watch?v=${video.id.videoId}`;
		const stream = await getYouTubeVideoStream(url);
		const resource = createAudioResource(stream);
		return new Song(resource, title, artist, type);
	}
	catch (error) {
		console.error('Error creating song from YouTube video:', error);
		return null;
	}
};

module.exports = {
	getYouTubeVideoInfo,
	getYouTubeVideoStream,
	createSongFromVideo,
};