const { SlashCommandBuilder } = require('discord.js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadFile(url) {
	const response = await axios.get(url, { responseType: 'arraybuffer' });
	return Buffer.from(response.data);
}

function validateCppFile(file) {
	const fileExtension = file.name.split('.').pop();
	if (fileExtension.toLowerCase() !== 'cpp') {
		throw new Error('Invalid file type. Only C++ files (.cpp) are allowed.');
	}
	const fileSizeLimit = 1024 * 1024;
	if (file.size > fileSizeLimit) {
		throw new Error('File size exceeds the limit of 1 MB.');
	}
}

async function executeCommand(command, options) {
	const { stdout, stderr } = await exec(command, options);
	return { stdout, stderr };
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('execute')
		.setDescription('Execute C++ code in a Docker container and return output.')
		.addAttachmentOption((option) =>
			option
				.setName('cpp_file')
				.setDescription('C++ file to execute')
				.setRequired(true),
		),
	async execute(interaction) {
		try {
			await interaction.deferReply();
			const file = interaction.options.getAttachment('cpp_file');
			const tempDir = path.join(__dirname, '../../temp');
			const filePath = path.join(tempDir, file.name);
			const fileBuffer = await downloadFile(file.url);
			fs.writeFileSync(filePath, fileBuffer);
			validateCppFile(file);
			const command = `
			 docker build -t cpp_compiler . &&
			 docker run -v "${tempDir}:/app" cpp_compiler /bin/bash -c "g++ ${file.name} -o output && ./output"
		   `;
			const { stdout, stderr } = await executeCommand(command, {
				cwd: path.join(__dirname, '../..'),
			});
			const output = stdout || stderr;
			fs.unlinkSync(filePath);
			await interaction.editReply('Output:\n' + output);
		}
		catch (error) {
			console.error(error);
			await interaction.editReply(
				'There was an error while executing your command!',
			);
		}
	},
};

// TODO: Refactor into command, manager, services.
