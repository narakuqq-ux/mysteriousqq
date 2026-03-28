const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "meme",
    version: "1.0.2",
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
    const filePath = path.join(cacheDir, `meme_${threadID}.jpg`);

    try {
      // meme-api.com is more reliable — returns Reddit memes with valid URLs
      const { data } = await axios.get("https://meme-api.com/gimme", { timeout: 10000 });

      const imageUrl = data.url;
      const title = data.title || "Random Meme";
      const subreddit = data.subreddit || "";

      if (!imageUrl || !imageUrl.startsWith("http")) {
        throw new Error("Invalid image URL from API: " + imageUrl);
      }

      await fs.ensureDir(cacheDir);

      const res = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      await fs.writeFile(filePath, res.data);

      await api.sendMessage(
        {
          body: `🎭 Random Meme\n\n📌 ${title}${subreddit ? `\n📂 r/${subreddit}` : ""}`,
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
