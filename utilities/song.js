const SongType = {
	UNKNOWN: 'unknown',
	LOCAL: 'local',
	YOUTUBE: 'youtube',
	SPOTIFY: 'spotify',
};

class Song {
	constructor(resource, title = 'Unknown', artist = 'Unknown', type = SongType.UNKNOWN) {
		this.resource = resource;
		this.title = title;
		this.artist = artist;
		this.type = type;
	}
}

module.exports = {
	SongType,
	Song,
};