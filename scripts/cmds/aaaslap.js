const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

const SLAP_MSGS = [
  "BINALIBAG! 👋",
  "Hala! Sinampaling! 😂",
  "Grabe yung sipa! 💥",
  "Aray! 🤕",
  "Laglag ngipin! 😵",
  "Nakuha ka! 👋",
];

module.exports = {
  config: {
    name: "slap",
    version: "2.0.0",
    author: "Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Slapan ang isang tao 👋" },
    category: "fun",
    guide: { en: "{pn} @mention" },
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    const mentions = Object.keys(event.mentions || {});

    if (!mentions[0]) {
      return api.sendMessage("❗ I-mention ang taong gusto mong slapan!", threadID, messageID);
    }

    const targetID   = mentions[0];
    const targetName = (event.mentions[targetID] || "").replace("@", "").trim();
    let senderName;
    try { senderName = await usersData.getName(senderID); } catch (e) { senderName = "Someone"; }

    let gifData;
    try {
      const res = await axios.get("https://api.waifu.pics/sfw/slap", { timeout: 10000 });
      const gifURL = res.data?.url;
      if (!gifURL) throw new Error("No URL");

      const ext     = gifURL.split('.').pop().split('?')[0] || "gif";
      const tmpPath = path.join(CACHE_DIR, `slap_${senderID}.${ext}`);

      await fs.ensureDir(CACHE_DIR);
      const imgRes = await axios.get(gifURL, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(tmpPath, Buffer.from(imgRes.data));

      const msg = SLAP_MSGS[Math.floor(Math.random() * SLAP_MSGS.length)];
      await api.sendMessage(
        {
          body: `${msg}\n${senderName} ay sinampaling si @${targetName}! 💢`,
          mentions: [{ tag: `@${targetName}`, id: targetID }],
          attachment: fs.createReadStream(tmpPath),
        },
        threadID,
        () => fs.unlink(tmpPath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[slap] Error:", err.message);
      return api.sendMessage("❌ Hindi makuha ang slap GIF. Subukan ulit!", threadID, messageID);
    }
  },
};
