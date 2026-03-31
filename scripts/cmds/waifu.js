const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "waifu",
    version: "1.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    category: "media",
    description: { en: "Generate a random waifu image." },
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `waifu_${Date.now()}.jpg`);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      await fs.ensureDir(cacheDir);

      const res = await axios.get("https://kryptonite-api-library.onrender.com/api/waifu", {
        responseType: "arraybuffer"
      });

      await fs.writeFile(filePath, Buffer.from(res.data));

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({
        body: "🌸 Here's your random waifu!",
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ Failed to fetch waifu. Please try again.", threadID, messageID);
    }
  }
};
