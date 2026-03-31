const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const PRICE = 100;

const GIFS = [
  "https://i.postimg.cc/nLTYtNx7/gsapmq496sv81.gif",
  "https://i.postimg.cc/rwW1f2qf/detail-3.gif",
  "https://i.postimg.cc/dQLWc1v1/detail-2.gif",
  "https://i.postimg.cc/3RWZhLs6/detail-1.gif",
  "https://i.postimg.cc/T2zc8JC7/detail.gif",
  "https://i.postimg.cc/y8VcBQ9P/7F1.gif",
  "https://i.postimg.cc/j5Krk7BL/19.gif"
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const queues = new Map();

function getNext(threadID) {
  if (!queues.has(threadID) || queues.get(threadID).length === 0) {
    queues.set(threadID, shuffle([...GIFS]));
  }
  return queues.get(threadID).shift();
}

module.exports = {
  config: {
    name: "hentai",
    version: "1.2.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "bawal sa inosente" },
    category: "nsfw",
    guide: { en: "{pn} — sends a hentai gif" }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;

    const userData = await usersData.get(senderID);
    const balance = userData.money || 0;

    if (balance < PRICE) {
      return api.sendMessage(
        `🔞 Access Denied!\n\nThis command costs $${PRICE} to use.\n\n💰 Your balance: $${balance.toLocaleString()}\n\nYou don't have enough money. Earn more money first and try again!`,
        threadID,
        messageID
      );
    }

    await usersData.set(senderID, { money: balance - PRICE });

    const url = getNext(threadID);
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `hentai_${Date.now()}.gif`);

    try {
      await fs.ensureDir(cacheDir);

      const response = await axios.get(encodeURI(url), { responseType: "arraybuffer", timeout: 20000 });
      await fs.writeFile(filePath, response.data);

      const remaining = queues.get(threadID)?.length ?? 0;

      await api.sendMessage(
        {
          body: `ugh 😋\n\n💸 $${PRICE} has been deducted from your wallet.\n🖼️ ${GIFS.length - remaining}/${GIFS.length} gifs sent`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlink(filePath).catch(() => {})
      );
    } catch (err) {
      console.error("[hentai] Error:", err.message);
      fs.unlink(filePath).catch(() => {});
      await usersData.set(senderID, { money: balance });
      return api.sendMessage(`❌ Failed to fetch gif. Your $${PRICE} has been refunded. Please try again later.`, threadID, messageID);
    }
  }
};
