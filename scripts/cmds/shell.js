
const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
	config: {
		name: "shell",
		aliases: ["sh", "terminal", "cmd"],
		version: "1.0",
		author: "ST | Sheikh Tamim",
		countDown: 3,
		role: 2, 
		shortDescription: "Execute shell commands",
		longDescription: "Execute shell/terminal commands like file operations, package installation, etc.\n\nBasic Usage Guide:\n• File Operations: ls, cat, touch, mkdir, rm\n• Package Install: npm install <package>\n• Create Files: echo 'content' > file.txt\n• View Files: cat filename.txt\n• Directory: cd, pwd, ls -la\n• System Info: whoami, date, uptime",
		category: "owner",
		guide: "{pn} <command>\nExamples:\n{pn} ls -la\n{pn} npm install axios\n{pn} touch newfile.txt\n{pn} echo 'Hello World' > test.txt\n{pn} cat package.json\n{pn} mkdir newfolder"
	},

	onStart: async function ({ message, args, event, api }) {
		const { threadID, senderID, messageID } = event;
		
		
		const botAdmins = global.GoatBot.config?.adminBot || [];
		if (!botAdmins.includes(senderID)) {
			return api.sendMessage("⛔ You are not authorized to use this command.", threadID, messageID);
		}

		if (!args[0]) {
			return api.sendMessage("⚠️ Please provide a shell command to execute.\nExample: /shell ls -la", threadID, messageID);
		}

		const command = args.join(' ');

		try {
			exec(command, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
				let response = '';

				if (error) {
					response = `❌ Command Failed\n📝 Command: \`${command}\`\n\n💥 Error:\n\`\`\`\n${error.message}\n\`\`\``;
				} else {
					response = `✅ Command Executed Successfully\n📝 Command: \`${command}\`\n\n`;
					
					if (stdout) {
						response += `📤 Output:\n\`\`\`\n${stdout}\n\`\`\``;
					}
					if (stderr) {
						response += `⚠️ Warning/Info:\n\`\`\`\n${stderr}\n\`\`\``;
					}
					if (!stdout && !stderr) {
						response += `✨ Command executed successfully with no output.`;
					}
				}

				// If response is too long, truncate it
				if (response.length > 2000) {
					response = response.substring(0, 1900) + "\n\n... (output truncated)";
				}

				api.sendMessage(response, threadID, messageID);
			});

		} catch (err) {
			api.sendMessage(`❌ Failed to execute command: ${err.message}`, threadID, messageID);
		}
	}
};
