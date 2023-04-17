const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const { AudioManager } = require('../managers/audio.js');
const {
	getSpotifyAccessToken,
	getSpotifyTrackInfo,
	getSpotifyPlaylistId,
	getSpotifyTrackId,
	validateSpotifyLink,
	SpotifyLinkType,
	createSongFromTrackInfo,
	getSpotifyPlaylistInfo,
} = require('../utilities/spotify.js');

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
				await interaction.editReply(
					'You need to be in a voice channel to use this command.',
				);
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
			const linkType = validateSpotifyLink(link);
			const accessToken = await getSpotifyAccessToken();
			if (linkType === SpotifyLinkType.INVALID) {
				await interaction.editReply('Invalid Spotify link.');
				return;
			}
			if (linkType === SpotifyLinkType.TRACK) {
				const trackId = getSpotifyTrackId(link);
				const trackInfo = await getSpotifyTrackInfo(trackId, accessToken);
				if (!trackInfo) {
					await interaction.editReply('Error getting track info.');
					return;
				}
				const song = await createSongFromTrackInfo(trackInfo, (err) => {
					interaction.editReply(err);
				});
				if (!song) {
					return;
				}
				await manager.play(song, (reply) => interaction.editReply(reply));
			}
			if (linkType === SpotifyLinkType.PLAYLIST) {
				const playlistId = getSpotifyPlaylistId(link);
				const playlistInfo = await getSpotifyPlaylistInfo(
					playlistId,
					accessToken,
				);
				if (!playlistInfo) {
					await interaction.editReply('Error getting playlist info.');
					return;
				}
				const songs = await Promise.all(
					playlistInfo.tracks.items.map(async (item) => {
						const song = await createSongFromTrackInfo(
							item.track,
							(err) => interaction.editReply(err),
						);
						if (!song) {
							return null;
						}
						return song;
					}),
				);
				if (!songs) {
					return;
				}
				await manager.playPlaylist(songs, (reply) => interaction.editReply(reply));
			}
			// TODO: Add support for albums.
			// TODO: Refactor connection?
			// TODO: refactor callback error into an error code.
			connection.subscribe(manager.player);
		}
		catch (error) {
			console.error('Error executing preview command:', error);
		}
	},
};
