const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "shoti",
    version: "1",
    author: "Siegfried Samá",
    countDown: 10,
    role: 0,
    category: "media",
    hasPrefix: false,
    guide: "",
    description: "Fetch a random shoti video."
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `shoti_${Date.now()}.mp4`);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      await fs.ensureDir(cacheDir);

      const response = await axios.get("https://betadash-api-swordslush-production.up.railway.app/shoti");
      const data = response.data.result;

      const videoUrl = data.shotiurl;
      const username = data.username || "N/A";
      const nickname = data.nickname || "N/A";
      const duration = data.duration || "0";
      const region = data.region || "Unknown";

      const videoRes = await axios.get(videoUrl, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, Buffer.from(videoRes.data, "binary"));

      const msg = `🎬 SHOTI\n\n👤 User: @${username}\n✨ Nick: ${nickname}\n⏳ Time: ${duration}s\n📍 Region: ${region}`;

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ Unable to fetch shoti video. Please try again.", threadID, messageID);
    }
  }
};
