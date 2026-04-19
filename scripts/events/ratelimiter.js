const userCommandLog = new Map();

const MAX_COMMANDS = 8;
const WINDOW_MS = 10 * 1000;
const WARN_THRESHOLD = 6;
const BLOCK_DURATION_MS = 30 * 1000;
const blockedUsers = new Map();
const warnedUsers = new Set();

const MAP_CLEANUP_INTERVAL = 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [uid, timestamps] of userCommandLog.entries()) {
    const fresh = timestamps.filter(t => now - t < WINDOW_MS);
    if (fresh.length === 0) userCommandLog.delete(uid);
    else userCommandLog.set(uid, fresh);
  }
  for (const [uid, until] of blockedUsers.entries()) {
    if (now >= until) {
      blockedUsers.delete(uid);
      warnedUsers.delete(uid);
    }
  }
}, MAP_CLEANUP_INTERVAL);

module.exports = {
  config: {
    name: "ratelimiter",
    version: "1.0.0",
    author: "Siegfried Samá",
    category: "events",
    description: { en: "Per-user command rate limiter to prevent spam and CPU abuse" }
  },

  onStart: function () {},

  onChat: async function ({ message, event, api }) {
    const { senderID, threadID, body } = event;
    if (!body || !body.startsWith("/")) return;

    const uid = String(senderID);
    const now = Date.now();

    const until = blockedUsers.get(uid);
    if (until) {
      if (now < until) {
        const secsLeft = Math.ceil((until - now) / 1000);
        try {
          await api.sendMessage(
            `⛔ You are sending commands too fast. Please wait ${secsLeft}s.`,
            threadID
          );
        } catch {}
        return api.unsendMessage ? undefined : undefined;
      } else {
        blockedUsers.delete(uid);
        warnedUsers.delete(uid);
      }
    }

    const log = userCommandLog.get(uid) || [];
    const recent = log.filter(t => now - t < WINDOW_MS);
    recent.push(now);
    userCommandLog.set(uid, recent);

    if (recent.length >= MAX_COMMANDS) {
      blockedUsers.set(uid, now + BLOCK_DURATION_MS);
      warnedUsers.delete(uid);
      console.warn(`[ratelimiter] Blocked user ${uid} for ${BLOCK_DURATION_MS / 1000}s (${recent.length} cmds / ${WINDOW_MS / 1000}s)`);
      try {
        await api.sendMessage(
          `🚫 You have been temporarily blocked for ${BLOCK_DURATION_MS / 1000}s due to command spam.`,
          threadID
        );
      } catch {}
      return;
    }

    if (recent.length >= WARN_THRESHOLD && !warnedUsers.has(uid)) {
      warnedUsers.add(uid);
      try {
        await api.sendMessage(
          `⚠️ Slow down! You're sending commands too fast. Continued spam will get you blocked.`,
          threadID
        );
      } catch {}
    }
  }
};
