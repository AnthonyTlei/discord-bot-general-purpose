const SongType = {
	UNKNOWN: 'unknown',
	LOCAL: 'local',
	YOUTUBE: 'youtube',
	SPOTIFY: 'spotify',
};

class Song {
	constructor(resource, title = null, artist = null, url = null, type = SongType.UNKNOWN) {
		this.resource = resource;
		this.title = title;
		this.artist = artist;
		this.url = url;
		this.type = type;
	}
}

module.exports = {
	SongType,
	Song,
};