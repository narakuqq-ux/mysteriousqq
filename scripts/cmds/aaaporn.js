const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const PRICE = 5000;

const VIDEOS = [
  "https://i.imgur.com/wBMdhlz.mp4",
  "https://i.imgur.com/BMmJsWl.mp4",
  "https://i.imgur.com/EASmcpx.mp4",
  "https://i.imgur.com/CQvI0lD.mp4",
  "https://i.imgur.com/tJA16qT.mp4",
  "https://i.imgur.com/wEyQrRm.mp4",
  "https://i.imgur.com/wnqrUcJ.mp4",
  "https://i.imgur.com/wMKgTzZ.mp4"
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const queues = new Map();

function getNext(threadID) {
  if (!queues.has(threadID) || queues.get(threadID).length === 0) {
    queues.set(threadID, shuffle([...VIDEOS]));
  }
  return queues.get(threadID).shift();
}

module.exports = {
  config: {
    name: "porn",
    version: "1.2",
    author: "Siegfried Samá",
    countDown: 10,
    role: 0,
    category: "media",
    description: { en: "wag mo gamitin kong bata ka, tanginamo" },
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.resolve(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const userData = await usersData.get(senderID);
    const balance = userData.money || 0;

    if (balance < PRICE) {
      return api.sendMessage(
        `🔞 Access Denied!\n\nThis command costs $${PRICE} to use.\n\n💰 Your balance: $${balance.toLocaleString()}\n\nYou don't have enough money. Earn more money first and try again!`,
        threadID,
        messageID
      );
    }

    await usersData.set(senderID, { money: balance - PRICE });
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const url = getNext(threadID);
    const filePath = path.join(cacheDir, `porn_${Date.now()}.mp4`);

    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const contentType = res.headers["content-type"] || "";
      if (!contentType.includes("video") && !contentType.includes("octet-stream")) {
        throw new Error("Not a video response");
      }

      await fs.writeFile(filePath, Buffer.from(res.data));
      const remaining = queues.get(threadID)?.length ?? 0;

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        {
          body: `💸 $${PRICE} has been deducted from your wallet.\n📹 ${VIDEOS.length - remaining}/${VIDEOS.length} videos sent`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlink(filePath).catch(() => {}),
        messageID
      );
    } catch (e) {
      fs.unlink(filePath).catch(() => {});
      await usersData.set(senderID, { money: balance });
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(`❌ Failed to fetch video. Your $${PRICE} has been refunded. Please try again.`, threadID, messageID);
    }
  }
};
