const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "1.1.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: {
      en: "Shows information about the bot owner"
    },
    category: "info",
    guide: {
      en: "{pn} — shows owner info with profile picture"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    const config = global.GoatBot.config;
    const botName = config.nickNameBot || "ST Bot";

    const ownerInfo = config.ownerInfo || {};
    const ownerName = ownerInfo.name || "Owner";
    const ownerUID = ownerInfo.uid || (config.adminBot && config.adminBot[0]) || "";
    const ownerLink = ownerInfo.link
      || (ownerUID ? `https://www.facebook.com/profile.php?id=${ownerUID}` : "N/A");

    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, "owner_pfp.png");

    const message = `» Owner of ${botName} «\n➟ ${ownerName} Senpai\n❂ Admin UID: ${ownerUID}\n♛ Admin FB Link:\n${ownerLink}`;

    if (!ownerUID) {
      return api.sendMessage(message, threadID, messageID);
    }

    try {
      await fs.ensureDir(cacheDir);

      const pfpUrl = `https://graph.facebook.com/${ownerUID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios.get(encodeURI(pfpUrl), { responseType: "arraybuffer" });
      await fs.writeFile(filePath, response.data);

      await api.sendMessage(
        { body: message, attachment: fs.createReadStream(filePath) },
        threadID,
        () => fs.unlink(filePath).catch(() => {})
      );
    } catch (err) {
      console.error("[owner] Failed to fetch profile picture:", err.message);
      return api.sendMessage(message, threadID, messageID);
    }
  }
};
