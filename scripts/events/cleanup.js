const fs = require("fs-extra");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "../cmds/cache");
const MAX_MEMORY_MB = 420;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

function cleanOldTempFiles() {
  try {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes old

    const tempPatterns = [/^dl_/, /^audio_/, /^avt_/, /^pairing_/, /^trump\.png$/, /^download\./];

    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) { scanDir(filePath); continue; }
          if (tempPatterns.some(p => p.test(file))) {
            if (now - stat.mtimeMs > maxAge) {
              fs.unlink(filePath, () => {});
            }
          }
        } catch (e) {}
      }
    };

    scanDir(CACHE_DIR);
  } catch (e) {}
}

function checkMemory() {
  const used = process.memoryUsage().rss / 1024 / 1024;
  if (used > MAX_MEMORY_MB) {
    console.error(`[cleanup] Memory usage ${Math.round(used)}MB exceeded ${MAX_MEMORY_MB}MB limit — restarting process`);
    setTimeout(() => process.exit(1), 1000);
  }
}

module.exports = {
  config: {
    name: "cleanup",
    version: "1.0.0",
    author: "Siegfried Samá",
    category: "events",
    description: { en: "Periodic cache cleanup and memory watchdog" }
  },

  onStart: function () {
    setInterval(() => {
      cleanOldTempFiles();
      checkMemory();
    }, CLEANUP_INTERVAL_MS);

    cleanOldTempFiles();
  }
};
