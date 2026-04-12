const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_BASE = "https://resstt-apii.leapcell.app/api/tools/imagine";
const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "imagine",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 15,
    role: 0,
    description: { en: "Generate an AI image from your prompt" },
    category: "ai",
    guide: { en: "{pn} <prompt> — generate image\nExample: {pn} anime girl cute dark with moon" }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return message.reply(
        "📸 AI Image Generator\n\nUsage: imagine <prompt>\nExample: imagine anime girl cute dark with moon"
      );
    }

    const prompt = args.join(" ").trim();

    const waitMsg = await new Promise(resolve =>
      api.sendMessage(`🎨 Generating image for: "${prompt}"\n\nPlease wait...`, threadID, (err, info) => resolve(info), messageID)
    );

    await fs.ensureDir(CACHE_DIR);
    const filePath = path.join(CACHE_DIR, `imagine_${Date.now()}.jpg`);

    try {
      const response = await axios.get(API_BASE, {
        params: { prompt },
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      await fs.writeFile(filePath, Buffer.from(response.data));

      await api.sendMessage(
        {
          body: `✅ Here's your image!\n\n📝 Prompt: ${prompt}`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlink(filePath).catch(() => {})
      );

      if (waitMsg && waitMsg.messageID) {
        api.unsendMessage(waitMsg.messageID);
      }

    } catch (err) {
      console.error("[imagine] Error:", err.message);
      fs.unlink(filePath).catch(() => {});
      return message.reply("❌ Failed to generate image. Please try again with a different prompt.");
    }
  }
};
