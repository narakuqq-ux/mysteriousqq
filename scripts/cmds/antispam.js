const spamTracker = new Map();
const SPAM_LIMIT = 10;

const SPAM_ROASTS = [
  "Hoy [name], sino nagturo sayo mag-spam? Bobo ka ba talaga o nagpapanggap lang? 🤡",
  "Grabe [name], ang dami mong pinagsasabi wala naman kwenta. Spam King ng Basura! 🗑️",
  "[name] AmpUta ka, paulit-ulit ka na parang broken record. Kick ka na! 🥊",
  "Huy [name]! Keyboard warrior ka ba? Sa spam ka lang matapang. Bye na! 😂",
  "[name] tangang spammer, wala ka bang ibang magawa sa buhay mo? 🤪",
  "Ayan na [name], natagpuan mo na ang speciality mo — pag-aaral ng SPAM. Loser! 😹",
  "[name] Bobo ka ba? Sampung beses na parehong mensahe. Saan ka nag-aral? 🤢",
  "Grabe [name], kahit basura may kwenta pa. Ikaw? Puro spam lang. Kick na! 🥊",
  "[name] Hahaha kawawa ka naman, wala kang ibang magawa kundi mag-spam. Pathetic! 😂",
  "[name] Tawag Ka Ng Amo Mo Gago! Alis na dito! 🖕"
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

module.exports = {
  config: {
    name: "antispam",
    version: "1.2.0",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    description: { en: "Auto-roast and kick spammers after 10 consecutive identical messages" },
    category: "security"
  },

  onStart: async function () {},

  onChat: async function ({ api, event, usersData, threadsData }) {
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

      try {
        const threadData = await threadsData.get(threadID);
        const adminIDs = (threadData.adminIDs || []).map(String);
        if (!adminIDs.includes(botID)) return;

        const name = (await usersData.getName(senderID)) || "User";

        const rawRoast = getRandom(SPAM_ROASTS);
        const body = rawRoast.replace(/\[name\]/g, name);

        const mentions = [];
        let idx = 0;
        while ((idx = body.indexOf(name, idx)) !== -1) {
          mentions.push({ tag: name, id: senderID, fromIndex: idx });
          idx += name.length;
        }

        await new Promise(resolve => api.sendMessage({ body, mentions }, threadID, resolve));
        await new Promise(resolve => setTimeout(resolve, 1500));
        await new Promise(resolve => api.removeUserFromGroup(senderID, threadID, resolve));
      } catch (err) {
        console.error("[antispam:spam] Error:", err.message);
      }
    }
  }
};
