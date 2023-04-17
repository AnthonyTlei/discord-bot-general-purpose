const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioResource } = require('@discordjs/voice');
const { AudioManager, AudioManagerEvents} = require('../managers/audio.js');
const { SongType, Song } = require('../utilities/song.js');
const { getYouTubeVideoInfo, getYouTubeVideoStream } = require('../utilities/youtube.js');

const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a song.')
		.addStringOption((option) =>
			option
				.setName('query')
				.setDescription('The query to search for.')
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
				await interaction.editReply('Failed to join voice channel.');
				return;
			}
			const query = interaction.options.getString('query');
			if (query) {
				const video = await getYouTubeVideoInfo(query);
				if (!video) {
					await interaction.editReply('Song not found.');
					return;
				}
				const title = video.snippet.title;
				const artist = video.snippet.channelTitle;
				const type = SongType.YOUTUBE;
				const url = `https://www.youtube.com/watch?v=${video.id.videoId}`;
				const stream = await getYouTubeVideoStream(url);
				const resource = createAudioResource(stream);
				const song = new Song(resource, title, artist, type);
				await manager.play(song, (reply) => interaction.editReply(reply));
				connection.subscribe(manager.player);
				await manager.on(AudioManagerEvents.ERROR, (error) => {
					console.error('Error in AudioManager:', error);
					// TODO: Make the message more descriptive. And display it last?
					interaction.editReply('Error playing song. Moving to next song.');
				});
			}
		}
		catch (error) {
			console.error('Error executing play command:', error);
		}
	},
};
