const { spawn, execSync } = require("child_process");
const log = require("./logger/log.js");

const REBRAND = [
  [/ST Bot - Enhanced version of GoatBot V2, modified and maintained by Sheikh Tamim\./g,
   "Mysteriousq AI Bot - Custom fork maintained by Siegfried Samá."],
  [/\[!\] The source code should only be downloaded from the official github page:[^\n]*/g,
   "[!] Custom bot maintained by Siegfried Samá."],
  [/\[!\] Thank you for using ST Bot\. Enhanced by Sheikh Tamim[^\n]*/g,
   "[!] Mysteriousq AI Bot — maintained by Siegfried Samá."],
  [/COPYRIGHT: ST Bot v[\d.]+ - Enhanced by Sheikh Tamim[^\n]*/g,
   "COPYRIGHT: Mysteriousq AI Bot — maintained by Siegfried Samá. All rights reserved."],
  [/ST Bot v[\d.]+/g, "Mysteriousq AI Bot"],
  [/ST-Bot/g, "Mysteriousq AI Bot"],
  [/ST Bot/g, "Mysteriousq AI Bot"],
  [/Sheikh Tamim/g, "Siegfried Samá"],
  [/Mysteriousq AI Bot\s*[-–—]+\s*Enhanced by Siegfried Samá[^\n]*/g,
   "Mysteriousq AI Bot — Customized and refined by Siegfried Samá.\nPowered by the original ST-BOT framework and inspired by GoatBot V2."],
  [/Checking for ST-FCA updates/g, "Checking for MysteriousqBot updates"],
  [/ST-FCA is up to date[^\n]*/g, "MysteriousqBot core is up to date"],
  [/ST-FCA[^\s]*/g, "MysteriousqBot"],
  [/ST-FCA/g, "MysteriousqBot"],
  [/Maintained\s*&\s*Enhanced by ST\b[^\n]*/g, "MysteriousqBot | Siegfried Samá"],
  [/\bST\s*\|\s*/g, "MysteriousqBot | "],
];

function applyRebrand(text) {
  for (const [pattern, replacement] of REBRAND) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

// Kill any orphaned mysteriousq.js or dashboard processes on startup
function killOrphans() {
  try { execSync("pkill -9 -f 'node mysteriousq.js'", { stdio: "ignore" }); } catch (_) {}
  try { execSync("fuser -k 3021/tcp", { stdio: "ignore" }); } catch (_) {}
}

let currentChild = null;
let isShuttingDown = false;
let restartCount = 0;
const MAX_RESTART_DELAY = 60 * 1000;
const BASE_RESTART_DELAY = 5 * 1000;

function getRestartDelay() {
  const delay = Math.min(BASE_RESTART_DELAY * Math.pow(1.5, restartCount), MAX_RESTART_DELAY);
  return Math.round(delay);
}

function killChild() {
  if (currentChild) {
    try { currentChild.kill("SIGKILL"); } catch (_) {}
    currentChild = null;
  }
}

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  killChild();
  try { execSync("pkill -9 -f 'node mysteriousq.js'", { stdio: "ignore" }); } catch (_) {}
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("exit", killChild);

// Parent-level memory monitor — logs every 10 minutes
setInterval(() => {
  const mem = process.memoryUsage();
  const rss = Math.round(mem.rss / 1024 / 1024);
  const heap = Math.round(mem.heapUsed / 1024 / 1024);
  log.info(`[launcher] Memory — RSS: ${rss}MB | Heap: ${heap}MB | Restarts: ${restartCount}`);
}, 10 * 60 * 1000).unref();

function startProject() {
  if (isShuttingDown) return;

  const child = spawn("node", ["mysteriousq.js"], {
    cwd: __dirname,
    stdio: ["inherit", "pipe", "pipe"],
  });

  currentChild = child;

  child.stdout.on("data", (chunk) => {
    process.stdout.write(applyRebrand(chunk.toString()));
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(applyRebrand(chunk.toString()));
  });

  child.on("close", (code) => {
    if (isShuttingDown) return;
    currentChild = null;
    if (code !== null) {
      const delay = getRestartDelay();
      restartCount++;
      log.info(`Bot stopped (exit code: ${code}). Restart #${restartCount} in ${delay / 1000}s...`);
      setTimeout(() => startProject(), delay);
    }
  });

  child.on("error", (err) => {
    if (isShuttingDown) return;
    currentChild = null;
    const delay = getRestartDelay();
    restartCount++;
    log.err("index", `Failed to start bot: ${err.message}. Restart #${restartCount} in ${delay / 1000}s...`);
    setTimeout(() => startProject(), delay);
  });

  // Reset restart counter after 5 minutes of stable uptime
  const stabilityTimer = setTimeout(() => { restartCount = 0; }, 5 * 60 * 1000);
  child.once("close", () => clearTimeout(stabilityTimer));
}

// Wipe all orphans first, then start clean
killOrphans();
startProject();
