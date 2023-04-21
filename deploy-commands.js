const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const args = process.argv.slice(2);
const deployTarget = args[0] || '';

const fs = require('node:fs');
const path = require('node:path');

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

const commands = [];
const commandFiles = [];
let commandsPath = path.join(__dirname, 'commands');
commandsPath = path.join(commandsPath, deployTarget);
if (!fs.existsSync(commandsPath)) {
	console.error('commandsPath does not exist');
	process.exit(1);
}

walk(commandsPath, (filePath, subfolder) => {
	commandFiles.push({ filePath, subfolder });
});

for (const { filePath, subfolder } of commandFiles) {
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

console.log('Commands: ');
for (const command of commands) {
	console.log(`- ${command.name}`);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);
		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}
})();
