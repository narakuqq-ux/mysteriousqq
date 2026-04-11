const likeCount = new Map();
const MAX_REPLIES = 5;

function getKey(threadID, senderID) {
  return `${threadID}_${senderID}`;
}

function isLikeZone(event) {
  if (!event) return false;

  // Detect the blue like/thumbs-up sticker
  if (event.attachments && event.attachments.length > 0) {
    const att = event.attachments[0];
    if (att.type === "sticker") return true;
  }

  // Also catch if they just sent the thumbs up emoji as text
  const body = (event.body || "").trim();
  if (body === "👍" || body === "👍🏻" || body === "👍🏼" || body === "👍🏽" || body === "👍🏾" || body === "👍🏿") {
    return true;
  }

  return false;
}

module.exports = {
  config: {
    name: "ntlz",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    description: { en: "Auto-reply when someone sends a like zone in GC" },
    category: "events"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    if (!event.isGroup) return;
    if (senderID === api.getCurrentUserID()) return;

    if (!isLikeZone(event)) return;

    const key = getKey(threadID, senderID);
    const count = likeCount.get(key) || 0;

    if (count >= MAX_REPLIES) return;

    likeCount.set(key, count + 1);

    const replies = [
      "NTLZ po, putanginamoka ☺️",
      "ntlz nga, bobo kaba?",
      "parang tanga naman oh"
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    return api.sendMessage(reply, threadID, messageID);
  }
};
