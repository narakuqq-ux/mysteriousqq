const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const checkCooldown = require('./utils/mediaCooldown');

const PRICE = 5000;
const API_BASE = "https://resstt-apppiii.vercel.app/api/hentai/api/videos";
const SORTS = ["popular", "newest", "rated"];
const CACHE_DIR = path.join(__dirname, "cache");
const MAX_SIZE = 24 * 1024 * 1024;

async function getRandomVideo() {
  const sort = SORTS[Math.floor(Math.random() * SORTS.length)];
  const res = await axios.get(`${API_BASE}?sort=${sort}&page=1`, { timeout: 15000 });
  const videos = res.data.videos;
  if (!videos || videos.length === 0) throw new Error("No videos returned from API");
  return videos[Math.floor(Math.random() * videos.length)];
}

module.exports = {
  config: {
    name: "hentai",
    version: "2.0",
    author: "Siegfried Samá",
    countDown: 10,
    role: 0,
    description: { en: "bawal sa inosente" },
    category: "nsfw",
    guide: { en: "{pn} — sends a hentai video" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    if (!await checkCooldown("hentai", senderID, api, threadID)) return;

    const userData = await usersData.get(senderID);
    const balance = userData.money || 0;

    if (balance < PRICE) {
      return api.sendMessage(
        `🔞 Access Denied!\n\nThis command costs $${PRICE} to use.\n\n💰 Your balance: $${balance.toLocaleString()}\n\nYou don't have enough money. Earn more money first!`,
        threadID,
        messageID
      );
    }

    await usersData.set(senderID, { money: balance - PRICE });

    await fs.ensureDir(CACHE_DIR);
    const filePath = path.join(CACHE_DIR, `hentai_${Date.now()}.mp4`);

    try {
      const video = await getRandomVideo();

      const headRes = await axios.head(video.trailerUrl, { timeout: 10000 }).catch(() => null);
      const contentLength = headRes ? parseInt(headRes.headers["content-length"] || "0") : 0;
      if (contentLength > MAX_SIZE) throw new Error("Video too large");

      const response = await axios.get(video.trailerUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://www.hentaicity.com/"
        }
      });

      const buf = Buffer.from(response.data);
      if (buf.length > MAX_SIZE) throw new Error("Video too large");

      await fs.writeFile(filePath, buf);

      await api.sendMessage(
        {
          body: `🔞 ${video.title}\n\n⏱️ ${video.duration} | 👁️ ${Number(video.views).toLocaleString()} views | ⭐ ${video.rating}\n\n💸 $${PRICE} deducted from your wallet.`,
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
        `❌ Failed to fetch video. Your $${PRICE} has been refunded. Please try again!`,
        threadID,
        messageID
      );
    }
  }
};
