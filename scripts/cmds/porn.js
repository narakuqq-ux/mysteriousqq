const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

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

module.exports = {
  config: {
    name: "porn",
    version: "1.0",
    author: "Siegfried Samá",
    countDown: 10,
    role: 0,
    category: "media",
    description: { en: "Send a random video." },
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const cacheDir = path.resolve(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const shuffled = shuffle(VIDEOS);

    for (const url of shuffled) {
      const filePath = path.join(cacheDir, `porn_${Date.now()}.mp4`);
      try {
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 20000,
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        const contentType = res.headers["content-type"] || "";
        if (!contentType.includes("video") && !contentType.includes("octet-stream")) {
          continue;
        }

        await fs.writeFile(filePath, Buffer.from(res.data));

        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage(
          { attachment: fs.createReadStream(filePath) },
          threadID,
          () => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); },
          messageID
        );
      } catch (e) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath).catch?.(() => {});
        continue;
      }
    }

    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Failed to fetch video. Please try again.", threadID, messageID);
  }
};
