const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const VIDEOS = [
  "https://i.imgur.com/ehtCBej.mp4",
  "https://i.imgur.com/B8TB4IF.mp4",
  "https://i.imgur.com/emR37Hu.mp4",
  "https://i.imgur.com/O7iLp5p.mp4",
  "https://i.imgur.com/NJERoxi.mp4"
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
    name: "xina",
    version: "1.0",
    author: "Siegfried Samá",
    countDown: 10,
    role: 0,
    category: "media",
    description: { en: "ttrap ng right hand man ni sieg" },
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const cacheDir = path.resolve(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const url = getNext(threadID);
    const filePath = path.join(cacheDir, `xina_${Date.now()}.mp4`);

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
          body: "Xina's ttrap😛",
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
