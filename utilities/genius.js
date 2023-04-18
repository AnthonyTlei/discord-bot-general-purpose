const { geniusAccessToken } = require('../config.json');
const axios = require('axios');
const cheerio = require('cheerio');

const formatLyrics = (lyrics) => {
	const formattedLyrics = lyrics;
	return formattedLyrics;
};

const getLyrics = async (song) => {
	const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(
		song.artist,
	)} ${encodeURIComponent(song.title)}&access_token=${geniusAccessToken}`;
	try {
		const searchResponse = await axios.get(searchUrl);
		const searchData = searchResponse.data;
		if (searchData.response.hits.length === 0) {
			return 'No lyrics found';
		}
		const lyricsUrl = searchData.response.hits[0].result.url;
		const lyricsResponse = await axios.get(lyricsUrl);
		const lyricsPageHtml = lyricsResponse.data;
		const $ = cheerio.load(lyricsPageHtml);
		const lyricsElement = $('div[class*="Lyrics__Container"], .lyrics');
		lyricsElement.find('br').replaceWith('\n');
		const lyrics = lyricsElement.text().trim();
		return formatLyrics(lyrics);
	}
	catch (error) {
		console.error('Error fetching lyrics:', error);
		return 'Error fetching lyrics';
	}
};

module.exports = {
	getLyrics,
};
