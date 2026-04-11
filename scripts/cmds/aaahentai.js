const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const checkCooldown = require('./utils/mediaCooldown');

const PRICE = 5000;
const CACHE_DIR = path.join(__dirname, "cache");
const MAX_SIZE = 24 * 1024 * 1024;

const NSFW_TYPES = ["waifu", "neko", "trap", "blowjob"];

async function getRandomImage() {
  const type = NSFW_TYPES[Math.floor(Math.random() * NSFW_TYPES.length)];
  const res = await axios.get(`https://api.waifu.pics/nsfw/${type}`, { timeout: 10000 });
  if (!res.data || !res.data.url) throw new Error("No image returned from API");
  return { url: res.data.url, type };
}

module.exports = {
  config: {
    name: "hentai",
    version: "2.1",
    author: "Siegfried Samá",
    countDown: 10,
    role: 0,
    description: { en: "bawal sa inosente" },
    category: "nsfw",
    guide: { en: "{pn} — sends a hentai image" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    if (!await checkCooldown("hentai", senderID, api, threadID)) return;

    const userData = await usersData.get(senderID);
    const balance = userData.money || 0;

    if (balance < PRICE) {
      return api.sendMessage(
        `🔞 Access Denied!\n\nThis command costs $${PRICE.toLocaleString()} to use.\n\n💰 Your balance: $${balance.toLocaleString()}\n\nYou don't have enough money. Earn more first!`,
        threadID,
        messageID
      );
    }

    await usersData.set(senderID, { money: balance - PRICE });
    await fs.ensureDir(CACHE_DIR);

    let imgData;
    try {
      imgData = await getRandomImage();
    } catch (err) {
      console.error("[hentai] Error:", err.message);
      await usersData.set(senderID, { money: balance });
      return api.sendMessage(
        `❌ Failed to fetch image. Your $${PRICE.toLocaleString()} has been refunded. Try again!`,
        threadID,
        messageID
      );
    }

    const ext = imgData.url.split(".").pop().split("?")[0] || "jpg";
    const filePath = path.join(CACHE_DIR, `hentai_${Date.now()}.${ext}`);

    try {
      const response = await axios.get(imgData.url, {
        responseType: "arraybuffer",
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const buf = Buffer.from(response.data);
      if (buf.length > MAX_SIZE) throw new Error("File too large");

      await fs.writeFile(filePath, buf);

      await api.sendMessage(
        {
          body: `🔞 Hentai [${imgData.type}]\n\n💸 $${PRICE.toLocaleString()} deducted from your wallet.`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlink(filePath).catch(() => {})
      );

    } catch (err) {
      console.error("[hentai] Error:", err.message);
      fs.unlink(filePath).catch(() => {});
      await usersData.set(senderID, { money: balance });
      return api.sendMessage(
        `❌ Failed to send image. Your $${PRICE.toLocaleString()} has been refunded. Try again!`,
        threadID,
        messageID
      );
    }
  }
};
