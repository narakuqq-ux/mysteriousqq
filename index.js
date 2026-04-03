const { spawn } = require("child_process");
const log = require("./logger/log.js");

function startProject() {
        const child = spawn("node", ["Goat.js"], {
                cwd: __dirname,
                stdio: "inherit",
                shell: true
        });

        child.on("close", (code) => {
                if (code !== null) {
                        log.info(`Bot stopped (exit code: ${code}). Restarting in 5 seconds...`);
                        setTimeout(() => startProject(), 5000);
                }
        });

        child.on("error", (err) => {
                log.err("index", `Failed to start bot: ${err.message}. Restarting in 5 seconds...`);
                setTimeout(() => startProject(), 5000);
        });
}

startProject();
