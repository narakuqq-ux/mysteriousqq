const spamTracker = new Map();
const savedThreadNames = new Map();
const SPAM_LIMIT = 10;

function getContentKey(event) {
  const { attachments, body } = event;
  if (attachments && attachments.length > 0) {
    const att = attachments[0];
    if (att.type === "sticker") return `sticker:${att.stickerID || att.id || "unknown"}`;
    if (att.type === "photo") return `photo:${att.previewUrl || att.url || att.id || "photo"}`;
    return `attachment:${att.type}`;
  }
  const text = (body || "").trim();
  if (!text) return null;
  return `text:${text}`;
}

async function isBotGroupAdmin(api, threadID) {
  try {
    const info = await api.getThreadInfo(threadID);
    const botID = String(api.getCurrentUserID());
    return (info.adminIDs || []).some(a => String(a.id) === botID);
  } catch {
    return false;
  }
}

module.exports = {
  config: {
    name: "antispam",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    description: { en: "Auto-kick spammers and thread name changers" },
    category: "security"
  },

  onStart: async function () {},

  onChat: async function ({ api, event, threadsData }) {
    const { threadID, senderID } = event;
    const botID = String(api.getCurrentUserID());
    if (String(senderID) === botID) return;

    const contentKey = getContentKey(event);
    if (!contentKey) return;

    const key = `${threadID}_${senderID}`;
    const tracker = spamTracker.get(key) || { content: null, count: 0 };

    if (tracker.content === contentKey) {
      tracker.count++;
    } else {
      tracker.content = contentKey;
      tracker.count = 1;
    }
    spamTracker.set(key, tracker);

    if (tracker.count >= SPAM_LIMIT) {
      spamTracker.delete(key);

      const isAdmin = await isBotGroupAdmin(api, threadID);
      if (!isAdmin) return;

      try {
        await new Promise(resolve => api.removeUserFromGroup(senderID, threadID, resolve));
        api.sendMessage(
          `⚠️ Anti-Spam: Isang miyembro ay na-kick dahil nag-spam ng ${SPAM_LIMIT} consecutive na parehong mensahe.`,
          threadID
        );
      } catch (err) {
        console.error("[antispam] Kick error:", err.message);
      }
    }
  },

  onEvent: async function ({ api, event, threadsData }) {
    if (event.logMessageType !== "log:thread-name") return;

    const { threadID, author } = event;
    const botID = String(api.getCurrentUserID());
    if (String(author) === botID) return;

    const isAdmin = await isBotGroupAdmin(api, threadID);
    if (!isAdmin) return;

    let oldName = savedThreadNames.get(threadID);
    if (!oldName) {
      oldName = await threadsData.get(threadID, "threadName");
    }
    if (!oldName) return;

    try {
      await new Promise(resolve => api.setTitle(oldName, threadID, resolve));
      savedThreadNames.set(threadID, oldName);

      await new Promise(resolve => api.removeUserFromGroup(author, threadID, resolve));
      api.sendMessage(
        `⚠️ Anti-Name-Change: Ang pangalan ng group ay binalik sa "${oldName}" at ang miyembrong nagpalit ay na-kick.`,
        threadID
      );
    } catch (err) {
      console.error("[antispam] Name change error:", err.message);
    }
  }
};
