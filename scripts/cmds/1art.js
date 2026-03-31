const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "art",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 10,
    role: 0,
    description: { en: "Generate AI art from a text prompt" },
    category: "ai",
    guide: { en: "{pn} <prompt>\nExample: {pn} a dragon in space" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage(
        "❗ Please provide a prompt.\n\nExample: /art a dragon in space",
        threadID,
        messageID
      );
    }

    const prompt = args.join(" ");
    const cacheDir = path.resolve(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      const res = await axios.get("https://urangkapolka.vercel.app/api/art", {
        params: { prompt },
        responseType: "arraybuffer",
        timeout: 30000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const contentType = res.headers["content-type"] || "";
      const filePath = path.join(cacheDir, `art_${Date.now()}.png`);

      if (contentType.includes("image")) {
        await fs.writeFile(filePath, Buffer.from(res.data));
        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage(
          { body: `🎨 Here's your art for: "${prompt}"`, attachment: fs.createReadStream(filePath) },
          threadID,
          () => fs.unlink(filePath).catch(() => {}),
          messageID
        );
      }

      const json = JSON.parse(Buffer.from(res.data).toString());
      const imgUrl = json?.url || json?.image || json?.result || json?.data?.url;

      if (!imgUrl) throw new Error("No image in response");

      const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 20000 });
      await fs.writeFile(filePath, Buffer.from(imgRes.data));

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        { body: `🎨 Here's your art for: "${prompt}"`, attachment: fs.createReadStream(filePath) },
        threadID,
        () => fs.unlink(filePath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[art] Error:", err.message);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ Failed to generate art. Please try again with a different prompt.", threadID, messageID);
    }
  }
};
