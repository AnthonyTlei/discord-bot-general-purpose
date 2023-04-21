const { createAudioResource } = require('@discordjs/voice');
const { youtubeAPIKey } = require('../config.json');
const { google } = require('googleapis');
const { Song, SongType } = require('./song');
const { URL } = require('url');
const ytdl = require('discord-ytdl-core');

const youtube = google.youtube({
	version: 'v3',
	auth: youtubeAPIKey,
});

const YouTubeLinkType = {
	INVALID: 'invalid',
	VIDEO: 'video',
	PLAYLIST: 'playlist',
};

const validateYouTubeUrl = (url) => {
	try {
		const parsedUrl = new URL(url);
		if (parsedUrl.hostname.endsWith('youtube.com')) {
			if (parsedUrl.pathname === '/watch' && parsedUrl.searchParams.has('v')) {
				return YouTubeLinkType.VIDEO;
			}
			else if (
				parsedUrl.pathname === '/playlist' &&
        parsedUrl.searchParams.has('list')
			) {
				return YouTubeLinkType.PLAYLIST;
			}
		}
		else if (parsedUrl.hostname === 'youtu.be') {
			const videoIdRegex = /^\/([\w-]{10,12})$/;
			if (videoIdRegex.test(parsedUrl.pathname)) {
				return YouTubeLinkType.VIDEO;
			}
		}
		return YouTubeLinkType.INVALID;
	}
	catch (error) {
		console.error('Error validating YouTube URL:', error);
		return YouTubeLinkType.INVALID;
	}
};

const extractYouTubeVideoId = (url) => {
	try {
		const parsedUrl = new URL(url);
		let videoId;

		if (
			parsedUrl.hostname === 'youtu.be' ||
      parsedUrl.hostname.endsWith('youtu.be')
		) {
			videoId = parsedUrl.pathname.substring(1);
		}
		else if (
			parsedUrl.hostname.endsWith('youtube.com') &&
      parsedUrl.pathname === '/watch'
		) {
			videoId = parsedUrl.searchParams.get('v');
		}
		else {
			throw new Error('Invalid YouTube URL');
		}

		return videoId;
	}
	catch (error) {
		console.error('Error extracting YouTube video ID:', error);
		throw error;
	}
};

const getYTVideoInfoFromURL = async (url) => {
	try {
		const videoId = extractYouTubeVideoId(url);
		const response = await youtube.videos.list({
			part: 'snippet',
			id: videoId,
		});
		return response.data.items[0];
	}
	catch (error) {
		console.error('Error getting YouTube video info:', error);
		throw error;
	}
};

const getYTVideoInfoFromQuery = async (query) => {
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
		throw error;
	}
};

const createResourceFromURL = async (url, options) => {
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
		return createAudioResource(stream);
	}
	catch (error) {
		console.error('Error creating audio resource from YouTube URL:', error);
		return null;
	}
};

const createSongFromVideoInfo = async (video) => {
	try {
		const title = video.snippet.title;
		const artist = video.snippet.channelTitle;
		const type = SongType.YOUTUBE;
		const id = video.id.videoId || video.id;
		const url = `https://www.youtube.com/watch?v=${id}`;
		const resource = await createResourceFromURL(url);
		return new Song(resource, title, artist, url, type);
	}
	catch (error) {
		console.error('Error creating song from YouTube video:', error);
		return error;
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
		console.error('Error creating song from YouTube JSON:', error);
		return null;
	}
};

module.exports = {
	createResourceFromURL,
	createSongFromJSON,
	createSongFromVideoInfo,
	getYTVideoInfoFromQuery,
	getYTVideoInfoFromURL,
	extractYouTubeVideoId,
	validateYouTubeUrl,
	YouTubeLinkType,
};
