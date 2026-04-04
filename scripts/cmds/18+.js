const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "18+",
    version: "3.0.1",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: {
      en: "Send a random 18+ image. Make sure you are 18 years old and above."
    },
    category: "nsfw",
    guide: {
      en: "{pn} — sends a random 18+ image"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    const PRICE = 5000;

    const userData = await usersData.get(senderID);
    const balance = userData.money || 0;
    if (balance < PRICE) {
      return api.sendMessage(
        `🔞 Access Denied!\n\nThis command costs $${PRICE.toLocaleString()} to use.\n\n💰 Your balance: $${balance.toLocaleString()}\n\nYou need more money first!`,
        threadID,
        messageID
      );
    }
    await usersData.set(senderID, { money: balance - PRICE });

    const links = [
      "https://i.postimg.cc/d1RFhjhB/IMG-20230424-200820.jpg",
      "https://i.postimg.cc/sXzdCGTZ/images-1.jpg",
      "https://i.postimg.cc/7ZzWPYG1/korean-girl-sexy-naked-fotos-1.jpg",
      "https://i.postimg.cc/Kcsqngtr/images-3.jpg",
      "https://i.postimg.cc/gJ2shYJT/images-4.jpg",
      "https://i.postimg.cc/3wJfXjf1/images-5.jpg",
      "https://i.postimg.cc/Dw5BwJfX/images-6.jpg",
      "https://i.postimg.cc/RVLTg6HD/images-7.jpg",
      "https://i.postimg.cc/s2kSjsWW/images-8.jpg",
      "https://i.postimg.cc/1XHNrFj0/images-9.jpg",
      "https://i.postimg.cc/6q98q3p8/images-11.jpg",
      "https://i.postimg.cc/ZKWTc32T/images-12.jpg",
      "https://i.postimg.cc/MKgzrHJ1/images-13.jpg",
      "https://i.postimg.cc/zfF5Bkbk/images-15.jpg",
      "https://i.postimg.cc/j58b6dhw/images-16.jpg",
      "https://i.postimg.cc/G2gW8gcv/images-17.jpg",
      "https://i.postimg.cc/W1mx61NN/images-18.jpg",
      "https://i.postimg.cc/SsPPNXrr/images-19.jpg",
      "https://i.postimg.cc/tCj2PdVN/images-20.jpg"
    ];

    const randomLink = links[Math.floor(Math.random() * links.length)];
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, "18plus_temp.jpg");

    try {
      await fs.ensureDir(cacheDir);

      const response = await axios.get(encodeURI(randomLink), { responseType: "arraybuffer" });
      await fs.writeFile(filePath, response.data);

      await api.sendMessage(
        { body: `'-'\n\n💸 $${PRICE.toLocaleString()} deducted from your wallet.`, attachment: fs.createReadStream(filePath) },
        threadID,
        () => fs.unlink(filePath).catch(() => {})
      );
    } catch (err) {
      console.error("[18+] Error:", err.message);
      fs.unlink(filePath).catch(() => {});
      await usersData.set(senderID, { money: balance });
      return api.sendMessage(`❌ Failed to fetch image. Your $${PRICE.toLocaleString()} has been refunded.`, threadID, messageID);
    }
  }
};
