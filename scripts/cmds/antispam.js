const spamTracker = new Map();
const savedThreadNames = new Map();
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

const NAME_ROASTS = [
  "Hoy [name]! Sino nagsabi sayo na pwede kang magpalit ng pangalan ng group? Alis! 🤡",
  "[name] AmpUta, kapal ng mukha mo magpalit ng pangalan ng group namin. Bye! 🥊",
  "Grabe [name], feeling admin ka ba? Hindi ka. Kick ka na! 😂",
  "[name] Bakit mo binago pangalan ng group? Wala kang karapatang gawin yan. Out! 🤢",
  "Huy [name]! Sino ka para magpalit ng pangalan ng group namin? Bobo ka talaga. 🤪",
  "[name] Alam mo bang may consequences ang ginawa mo? Eto na — KICK! 😹",
  "[name] Feeling boss ka ba? Wala kang dating dito. Alis na! 😀🖕",
  "Grabe [name], kahit saan ka pumunta ganyan ka — walang kwenta. Bye! 🗑️",
  "[name] Tanga ka ba? Binago mo pangalan ng group. Sana natulog ka na lang. 🤣",
  "[name] Ikaw na magaling! Nagpalit ng group name... tapos KICKED! Haha bye! 🥊"
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

async function isBotGroupAdmin(api, threadID) {
  try {
    const info = await api.getThreadInfo(threadID);
    const botID = String(api.getCurrentUserID());
    return (info.adminIDs || []).some(a => String(a.id) === botID);
  } catch {
    return false;
  }
}

async function sendRoastThenKick(api, threadID, userID, name, roastPool) {
  const rawRoast = getRandom(roastPool);
  const body = rawRoast.replace(/\[name\]/g, name);

  const mentions = [];
  let idx = 0;
  while ((idx = body.indexOf(name, idx)) !== -1) {
    mentions.push({ tag: name, id: userID, fromIndex: idx });
    idx += name.length;
  }

  await new Promise(resolve => {
    api.sendMessage({ body, mentions }, threadID, resolve);
  });

  await new Promise(resolve => setTimeout(resolve, 1500));
  await new Promise(resolve => api.removeUserFromGroup(userID, threadID, resolve));
}

module.exports = {
  config: {
    name: "antispam",
    version: "1.1.0",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    description: { en: "Auto-roast and kick spammers and thread name changers" },
    category: "security"
  },

  onStart: async function () {},

  onChat: async function ({ api, event, usersData }) {
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
        const name = await usersData.getName(senderID);
        await sendRoastThenKick(api, threadID, senderID, name, SPAM_ROASTS);
      } catch (err) {
        console.error("[antispam] Spam kick error:", err.message);
      }
    }
  },

  onEvent: async function ({ api, event, threadsData, usersData }) {
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

      const name = await usersData.getName(author);
      await sendRoastThenKick(api, threadID, author, name, NAME_ROASTS);
    } catch (err) {
      console.error("[antispam] Name change kick error:", err.message);
    }
  }
};
