const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const checkCooldown = require('./utils/mediaCooldown');

const stbotApi = new global.utils.STBotApis();
const MAX_FILE_SIZE_MB = 24;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

module.exports = {
  config: {
    name: "autodl",
    aliases: [],
    version: "2.4.77",
    author: "ST | Sheikh Tamim",
    countDown: 5,
    role: 0,
    shortDescription: "Auto download videos from 12+ platforms",
    longDescription: "",
    category: "media",
    guide: {
      en: `Auto download from 12+ platforms: TikTok, Facebook, Instagram, YouTube, Twitter, Pinterest, Reddit, LinkedIn, CapCut, Douyin, Snapchat, Threads, Tumblr`,
    },
  },

  onStart: () => {},

  onChat: async function ({ message, event, usersData, api }) {
    const url = event.body?.trim() || "";
    if (!url) return;

    try {
      const supportedPlatforms = [
        "vt.tiktok.com", "www.tiktok.com", "vm.tiktok.com",
        "facebook.com", "fb.watch",
        "instagram.com",
        "youtu.be", "youtube.com",
        "x.com", "twitter.com",
        "pin.it", "pinterest.com",
        "reddit.com", "redd.it",
        "linkedin.com",
        "capcut.com",
        "douyin.com",
        "snapchat.com",
        "threads.net",
        "tumblr.com"
      ];

      const urlPattern = /(?:https?:\/\/)?[^\s]+/gi;
      const urls = url.match(urlPattern);
      if (!urls || urls.length === 0) return;

      const validUrl = urls.find(u => {
        const urlToCheck = u.startsWith('http') ? u : `https://${u}`;
        return supportedPlatforms.some(domain => urlToCheck.toLowerCase().includes(domain));
      });

      if (!validUrl) return;

      // Cooldown only applied after confirming it's a valid download link
      if (!await checkCooldown("autodl", event.senderID, api, event.threadID)) return;

      // Add https if missing
      const finalUrl = validUrl.startsWith('http') ? validUrl : `https://${validUrl}`;

      const isYouTube = finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be');

      let videoUrl, data;

      if (isYouTube) {
        const apiUrl = `${stbotApi.baseURL}/audioytdlv1`;
        const response = await axios.post(apiUrl, { url: finalUrl, format: "720" }, {
          headers: stbotApi.getHeaders(true)
        });
        data = response.data;
        if (!data?.success || !data?.downloadUrl) return;
        videoUrl = data.downloadUrl;
      } else {
        const apiUrl = `${stbotApi.baseURL}/api/download/auto`;
        const response = await axios.post(apiUrl, { url: finalUrl }, {
          headers: stbotApi.getHeaders(true)
        });
        data = response.data;
        if (!data?.success || !data?.data?.videos?.length) return;
        videoUrl = data.data.videos[0];
      }

      // Check file size via HEAD request before downloading
      try {
        const headRes = await axios.head(videoUrl, { timeout: 5000 });
        const contentLength = parseInt(headRes.headers["content-length"] || "0");
        if (contentLength > MAX_FILE_SIZE_BYTES) {
          return message.reply(`❌ File is too large (${(contentLength / 1024 / 1024).toFixed(1)} MB). Facebook limit is ${MAX_FILE_SIZE_MB} MB.`);
        }
      } catch (_) {}

      const fileExt = path.extname(videoUrl.split("?")[0]) || ".mp4";
      const cacheDir = path.join(__dirname, "cache");
      const filePath = path.join(cacheDir, `dl_${Date.now()}_${event.messageID}${fileExt}`);

      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const media = await axios.get(videoUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(media.data, "binary");

      // Double-check actual downloaded size
      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        return message.reply(`❌ File is too large (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Facebook limit is ${MAX_FILE_SIZE_MB} MB.`);
      }

      fs.writeFileSync(filePath, buffer);

      try {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        await message.reply({ attachment: fs.createReadStream(filePath) });
      } finally {
        fs.unlink(filePath, () => {});
      }

    } catch (err) {
      console.error("autodl error:", err.message);
    }
  },
};
