const fs = require("fs-extra");
const path = require("path");
const os = require("os");

const CACHE_DIR = path.join(__dirname, "../cmds/cache");
const MAX_MEMORY_MB = 400;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_FILE_AGE_MS = 3 * 60 * 1000;
const DAILY_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DAILY_MAX_FILE_AGE_MS = 24 * 60 * 60 * 1000;

const TEMP_PATTERNS = [
  /^dl_/,
  /^audio_/,
  /^avt_/,
  /^pairing_/,
  /^trump\.png$/,
  /^download\./,
  /^rankup_/,
  /^img_/,
  /^image_/,
  /^video_/,
  /^gif_/,
  /^sticker_/,
  /^tmp_/,
  /^temp_/,
  /^canvas_/,
  /\.(mp3|mp4|aac|ogg|wav|webm|gif|jpg|jpeg|png|webp)$/i,
];

const STATIC_KEEP = new Set([
  "bans.json",
  "billboard_bg.jpg",
  "hon.png",
  "siegfried_bg.jpg",
  "leave_static.gif",
  "pairing.jpg",
]);

const KEEP_SUBDIRS = new Set(["canvas", "rankup"]);

let totalCleaned = 0;

function shouldDelete(file, stat, now) {
  if (STATIC_KEEP.has(file)) return false;
  const age = now - stat.mtimeMs;
  if (age < MAX_FILE_AGE_MS) return false;
  return TEMP_PATTERNS.some(p => p.test(file));
}

function scanAndClean(dir, depth = 0) {
  if (!fs.existsSync(dir)) return 0;
  if (depth > 3) return 0;

  let count = 0;
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return 0; }

  const now = Date.now();

  for (const file of entries) {
    const filePath = path.join(dir, file);
    let stat;
    try { stat = fs.statSync(filePath); } catch { continue; }

    if (stat.isDirectory()) {
      if (depth === 0 && KEEP_SUBDIRS.has(file)) {
        count += scanAndClean(filePath, depth + 1);
      }
      continue;
    }

    if (shouldDelete(file, stat, now)) {
      try {
        fs.unlinkSync(filePath);
        count++;
        totalCleaned++;
      } catch {}
    }
  }
  return count;
}

function cleanTmp() {
  let count = 0;
  const tmp = os.tmpdir();
  let entries;
  try { entries = fs.readdirSync(tmp); } catch { return; }
  const now = Date.now();
  for (const file of entries) {
    if (!/^(goat|bot|fca|tmp|dl_|audio_|img_)\w*/i.test(file)) continue;
    const filePath = path.join(tmp, file);
    let stat;
    try { stat = fs.statSync(filePath); } catch { continue; }
    if (stat.isDirectory()) continue;
    if (now - stat.mtimeMs > MAX_FILE_AGE_MS) {
      try { fs.unlinkSync(filePath); count++; totalCleaned++; } catch {}
    }
  }
  return count;
}

function getMemoryStats() {
  const mem = process.memoryUsage();
  return {
    rss: Math.round(mem.rss / 1024 / 1024),
    heap: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    external: Math.round(mem.external / 1024 / 1024),
  };
}

function runCleanup() {
  const cacheCount = scanAndClean(CACHE_DIR);
  const tmpCount = cleanTmp() || 0;
  const mem = getMemoryStats();

  const total = cacheCount + tmpCount;
  if (total > 0) {
    console.log(
      `[cleanup] Removed ${total} temp file(s) (${cacheCount} cache, ${tmpCount} /tmp) | ` +
      `Lifetime total: ${totalCleaned}`
    );
  }

  console.log(
    `[memory] RSS: ${mem.rss}MB | Heap: ${mem.heap}/${mem.heapTotal}MB | External: ${mem.external}MB`
  );

  if (mem.rss > MAX_MEMORY_MB) {
    console.error(
      `[cleanup] ⚠️ Memory ${mem.rss}MB exceeded ${MAX_MEMORY_MB}MB limit — triggering restart`
    );
    setTimeout(() => process.exit(1), 500);
  }
}

function dailySweep(dir, depth = 0) {
  if (!fs.existsSync(dir)) return { count: 0, bytes: 0 };
  if (depth > 3) return { count: 0, bytes: 0 };

  let count = 0;
  let bytes = 0;
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return { count: 0, bytes: 0 }; }

  const now = Date.now();

  for (const file of entries) {
    if (file.startsWith(".")) continue;
    const filePath = path.join(dir, file);
    let stat;
    try { stat = fs.statSync(filePath); } catch { continue; }

    if (stat.isDirectory()) {
      if (depth === 0 && KEEP_SUBDIRS.has(file)) {
        const sub = dailySweep(filePath, depth + 1);
        count += sub.count;
        bytes += sub.bytes;
      }
      continue;
    }

    if (depth === 0 && STATIC_KEEP.has(file)) continue;
    if (now - stat.mtimeMs < DAILY_MAX_FILE_AGE_MS) continue;

    try {
      const size = stat.size;
      fs.unlinkSync(filePath);
      count++;
      bytes += size;
      totalCleaned++;
    } catch {}
  }
  return { count, bytes };
}

function runDailyCleanup() {
  const { count, bytes } = dailySweep(CACHE_DIR);
  const mb = (bytes / 1024 / 1024).toFixed(2);
  console.log(
    `[cleanup:daily] Removed ${count} cache file(s) older than 24h, freed ${mb}MB`
  );
}

module.exports = {
  config: {
    name: "cleanup",
    version: "2.0.0",
    author: "Siegfried Samá",
    category: "events",
    description: { en: "Periodic temp file cleanup and memory watchdog" }
  },

  onStart: function () {
    runCleanup();
    setInterval(runCleanup, CLEANUP_INTERVAL_MS);

    runDailyCleanup();
    setInterval(runDailyCleanup, DAILY_CLEANUP_INTERVAL_MS);
  }
};
