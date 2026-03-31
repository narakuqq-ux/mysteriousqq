const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "hentai",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: {
      en: "bawal sa inosente"
    },
    category: "nsfw",
    guide: {
      en: "{pn} — sends a random hentai gif"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    const links = [
      "https://i.postimg.cc/nLTYtNx7/gsapmq496sv81.gif",
      "https://i.postimg.cc/rwW1f2qf/detail-3.gif",
      "https://i.postimg.cc/dQLWc1v1/detail-2.gif",
      "https://i.postimg.cc/3RWZhLs6/detail-1.gif",
      "https://i.postimg.cc/T2zc8JC7/detail.gif",
      "https://i.postimg.cc/y8VcBQ9P/7F1.gif",
      "https://i.postimg.cc/j5Krk7BL/19.gif"
    ];

    const randomLink = links[Math.floor(Math.random() * links.length)];
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, "hentai_temp.gif");

    try {
      await fs.ensureDir(cacheDir);

      const response = await axios.get(encodeURI(randomLink), { responseType: "arraybuffer" });
      await fs.writeFile(filePath, response.data);

      await api.sendMessage(
        { body: "ugh 😋", attachment: fs.createReadStream(filePath) },
        threadID,
        () => fs.unlink(filePath).catch(() => {})
      );
    } catch (err) {
      console.error("[hentai] Error:", err.message);
      return api.sendMessage("❌ Failed to fetch gif. Please try again later.", threadID, messageID);
    }
  }
};
