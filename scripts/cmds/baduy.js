const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const checkCooldown = require('./utils/mediaCooldown');

const VIDEOS = [
  "https://imgur.com/s3A1Mb6.mp4",
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
    name: "baduy",
    version: "1.0",
    author: "Siegfried Samá",
    countDown: 10,
    role: 0,
    category: "media",
    description: { en: "Magpadala ng baduy video" },
    guide: { en: "{pn} baduy" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    if (!await checkCooldown("baduy", senderID, api, threadID)) return;

    const cacheDir = path.resolve(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const url = getNext(threadID);
    const filePath = path.join(cacheDir, `baduy_${Date.now()}.mp4`);

    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      await fs.writeFile(filePath, Buffer.from(res.data));

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        {
          body: "😄😄😄",
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlink(filePath).catch(() => {}),
        messageID
      );
    } catch (e) {
      fs.unlink(filePath).catch(() => {});
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ Failed to fetch video. Subukan ulit.", threadID, messageID);
    }
  }
};
