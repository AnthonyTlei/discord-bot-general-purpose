const fs = require('node:fs');
const path = require('node:path');
require('./utilities/redis.js');

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { startClock } = require('./utilities/clock');

let deployTargets = process.argv.slice(2);
if (deployTargets.length === 0) {
	deployTargets.push('all');
}

if (deployTargets.includes('all')) {
	deployTargets = ['all'];
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
});

client.commands = new Collection();

let commandFiles = [];

function walk(dir, callback, subfolder = '') {
	fs.readdirSync(dir).forEach((f) => {
		const dirPath = path.join(dir, f);
		const isDirectory = fs.statSync(dirPath).isDirectory();
		const newSubfolder = path.join(subfolder, f);

		if (isDirectory) {
			walk(dirPath, callback, newSubfolder);
		}
		else {
			callback(path.join(dir, f), newSubfolder);
		}
	});
}

for (const target of deployTargets) {
	let commandsPath = path.join(__dirname, 'commands');
	if (target !== 'all') {
		commandsPath = path.join(commandsPath, target);
	}
	if (!fs.existsSync(commandsPath)) {
		console.error('commandsPath does not exist');
		process.exit(1);
	}
	walk(commandsPath, (filePath, subfolder) => {
		commandFiles.push({ filePath, subfolder });
	});
}

commandFiles = commandFiles.filter((file) => file.filePath.endsWith('.js'));

console.log('Listening to commands: ');
// eslint-disable-next-line no-unused-vars
for (const { filePath, subfolder } of commandFiles) {
	console.log(`- ${subfolder}`);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = file.filePath;
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
	else {
		console.log(
			`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
		);
	}
}

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);
startClock();
