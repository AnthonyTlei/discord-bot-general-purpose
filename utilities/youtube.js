const { createAudioResource } = require('@discordjs/voice');
const { youtubeAPIKey } = require('../config.json');
const { google } = require('googleapis');
const { Song, SongType } = require('./song');
const ytdl = require('discord-ytdl-core');

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

const createStreamFromURL = async (url, options) => {
	try {
		const stream = await ytdl(url, {
			filter: 'audioonly',
			highWaterMark: 1 << 25,
			quality: 'highestaudio',
			opusEncoded: true,
			encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200'],
			...options,
		});
		stream.on('error', (error) => {
			console.error('Error in audio stream:', error);
		});
		return stream;
	}
	catch (error) {
		console.error('Error creating Youtube video stream:', error);
		return null;
	}
};

const createResourceFromURL = async (url, options) => {
	try {
		const stream = await createStreamFromURL(url, options);
		return createAudioResource(stream);
	}
	catch (error) {
		console.error('Error creating audio resource from YouTube URL:', error);
		return null;
	}
};

const createSongFromVideo = async (video) => {
	try {
		const title = video.snippet.title;
		const artist = video.snippet.channelTitle;
		const type = SongType.YOUTUBE;
		const url = `https://www.youtube.com/watch?v=${video.id.videoId}`;
		const resource = await createResourceFromURL(url);
		return new Song(resource, title, artist, url, type);
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
		const type = song.type || SongType.YOUTUBE;
		const url = song.url;
		const resource = await createResourceFromURL(url);
		return new Song(resource, title, artist, url, type);
	}
	catch (error) {
		console.error('Error creating song from YouTube video:', error);
		return null;
	}
};

module.exports = {
	createResourceFromURL,
	createSongFromJSON,
	createSongFromVideo,
	createStreamFromURL,
	getYouTubeVideoInfo,
};
