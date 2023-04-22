const SongType = {
	UNKNOWN: 'unknown',
	LOCAL: 'local',
	YOUTUBE: 'youtube',
	SPOTIFY: 'spotify',
};

class SongDTO {
	constructor(resource, title = null, artist = null, url = null, type = SongType.UNKNOWN) {
		this.resource = resource;
		this.title = title;
		this.artist = artist;
		this.url = url;
		this.type = type;
	}
}

class VideoDTO {
	constructor({ id, title, channel, url }) {
		this.id = id;
		this.title = title;
		this.channel = channel;
		this.url = url;
	}
}

module.exports = {
	SongType,
	SongDTO,
	VideoDTO,
};