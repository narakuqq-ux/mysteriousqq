const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "meme",
    version: "1.0.1",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: {
      en: "Sends a random meme with title"
    },
    category: "media",
    guide: {
      en: "{pn} — sends a random meme"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `meme_${threadID}.png`);

    try {
      const gen = await axios.get("https://api.popcat.xyz/meme");
      const imageUrl = gen.data.image;
      const title = gen.data.title || "No title";

      await fs.ensureDir(cacheDir);

      const res = await axios.get(encodeURI(imageUrl), {
        responseType: "arraybuffer",
        timeout: 10000
      });
      await fs.writeFile(filePath, res.data);

      await api.sendMessage(
        {
          body: `====Random Meme====\n\nTitle: ${title}`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlink(filePath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[meme] Error:", err.message);
      return api.sendMessage("❌ Failed to fetch meme. Please try again later.", threadID, messageID);
    }
  }
};
