const { SlashCommandBuilder } = require('discord.js');
const {
	joinVoiceChannel,
	createAudioResource,
} = require('@discordjs/voice');

const { AudioManager } = require('../managers/audio.js');
const { SongType, Song } = require('../utilities/song.js');
const { getSpotifyAccessToken, getSpotifyTrackInfo } = require('../utilities/spotify.js');

const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('preview')
		.setDescription('Plays a preview of a Spotify track.')
		.addStringOption((option) =>
			option
				.setName('link')
				.setDescription('The Link of the Spotify track to preview.')
				.setRequired(true)
				.setMaxLength(2000),
		),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			if (!interaction.member.voice.channelId) {
				await interaction.editReply('You need to be in a voice channel to use this command.');
				return;
			}
			const connection = joinVoiceChannel({
				channelId: interaction.member.voice.channelId,
				guildId: interaction.guildId,
				adapterCreator: interaction.guild.voiceAdapterCreator,
			});
			if (!connection) {
				await interaction.editReply('Error joining voice channel.');
				return;
			}
			const link = interaction.options.getString('link');
			if (link) {
				const accessToken = await getSpotifyAccessToken();
				const trackId = link.split('/').pop();
				const trackInfo = await getSpotifyTrackInfo(trackId, accessToken);
				const title = trackInfo.name;
				const artist = trackInfo.artists[0].name;
				const type = SongType.SPOTIFY;
				if (!trackInfo.preview_url) {
					await interaction.editReply('No preview available for this song.');
					return;
				}
				const resource = createAudioResource(trackInfo.preview_url);
				const song = new Song(resource, title, artist, type);
				await manager.play(song, (reply) => interaction.editReply(reply));
				connection.subscribe(manager.player);
			}
		}
		catch (error) {
			console.error('Error executing preview command:', error);
		}
	},
};
