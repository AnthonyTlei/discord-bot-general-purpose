const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const { AudioManager, AudioManagerEvents } = require('../managers/audio.js');

const fs = require('fs');
const path = require('path');
const { createSongFromJSON } = require('../utilities/youtube.js');
const manager = new AudioManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play-list')
		.setDescription('Plays the pre-build playlist.'),
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
			const playlistsPath = path.join(__dirname, '..', 'data', 'playlists.json');
			const data = fs.readFileSync(playlistsPath, 'utf8');
			const parsedData = JSON.parse(data);
			const songs = [];
			// TODO: Make this a command argument. (Discord options)
			const playlist = parsedData.mood;
			for (const entry of playlist) {
				const song = await createSongFromJSON(entry);
				songs.push(song);
			}
			await manager.playPlaylist(songs, (reply) =>
				interaction.editReply(reply),
			);
			connection.subscribe(manager.player);
			await manager.on(AudioManagerEvents.ERROR, (error) => {
				console.error('Error in AudioManager:', error);
				interaction.editReply('Error playing song. Moving to next song.');
			});
		}
		catch (error) {
			console.error('Error executing preview command:', error);
		}
	},
};
