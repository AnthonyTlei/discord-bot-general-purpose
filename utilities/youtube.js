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
		const streamOptions = {
			filter: 'audioonly',
			highWaterMark: 1 << 25,
		};
		return await ytdl(url, { streamOptions });
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
		stream.on('error', (error) => {
			console.error('Error in audio stream:', error);
		});
		const resource = createAudioResource(stream);
		return new Song(resource, title, artist, type);
	}
	catch (error) {
		console.error('Error creating song from YouTube video:', error);
		return null;
	}
};

const createSongFromJSON = async (song) => {
	try {
		const title = song.title;
		const artist = song.artist;
		const type = SongType.YOUTUBE;
		const url = song.url;
		const stream = await getYouTubeVideoStream(url);
		stream.on('error', (error) => {
			console.error('Error in audio stream:', error);
		});
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
	createSongFromJSON,
};
