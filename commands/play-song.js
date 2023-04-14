const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
  AudioPlayerStatus ,
} = require("@discordjs/voice");
const { spotifyClientId, spotifyClientSecret } = require("../config.json");

const axios = require("axios");
const credentials = Buffer.from(
  `${spotifyClientId}:${spotifyClientSecret}`
).toString("base64");

const fs = require("fs");

async function getSpotifyAccessToken() {
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    return null;
  }
}

async function getSpotifyTrackInfo(trackId, accessToken) {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting Spotify track info:", error);
    return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play-song")
    .setDescription("Plays the song you want to listen to.")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("The input to echo back")
        .setRequired(true)
        .setMaxLength(2000)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const link = interaction.options.getString("link");
      if (link) {
        const connection = joinVoiceChannel({
          channelId: interaction.member.voice.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        // const accessToken = await getSpotifyAccessToken();
        // const trackId = link.split("/").pop();
        // const trackInfo = await getSpotifyTrackInfo(trackId, accessToken);
        // console.log(`Preview URL: ${trackInfo.preview_url}`);
        const player = createAudioPlayer();
        // const resource = createAudioResource(trackInfo.preview_url);
        const resource = createAudioResource(
          fs.createReadStream(
            "/home/tleiji/dev/system-discord-bot/assets/song.mp3"
          )
        );
        player.play(resource);
        player.on(AudioPlayerStatus.Playing, () => {
          console.log('The audio player has started playing!');
        });
        player.on('error', error => {
          console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });
        connection.subscribe(player);
        await interaction.editReply("Playing song!");
      }
    } catch (error) {
      console.error("Error executing play-song command:", error);
      await interaction.editReply(
        "An error occurred while trying to play the song."
      );
    }
  },
};
