const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");
const checkCooldown = require('./utils/mediaCooldown');

const CANVAS_DIR = path.join(__dirname, "cache", "canvas");
const BG_PATH = path.join(CANVAS_DIR, "pairing.jpg");

const BG_URLS = [
  "https://i.pinimg.com/736x/15/fa/9d/15fa9d71cdd07486bb6f728dae2fb264.jpg",
  "https://i.postimg.cc/15fa9d71/cdd07486bb6f728dae2fb264.jpg"
];

const DL_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
};

async function downloadBG() {
  await fs.ensureDir(CANVAS_DIR);
  for (const url of BG_URLS) {
    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 12000,
        headers: DL_HEADERS
      });
      fs.writeFileSync(BG_PATH, Buffer.from(res.data));
      console.log("[pair] Background downloaded from:", url);
      return true;
    } catch (err) {
      console.warn(`[pair] Failed BG from ${url}: ${err.message}`);
    }
  }
  return false;
}

async function circularBuffer(imgPath) {
  const img = await Jimp.read(imgPath);
  const size = Math.min(img.getWidth(), img.getHeight());
  img.resize(size, size);
  const circle = new Jimp(size, size, 0x00000000);
  const r = size / 2;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const dist = Math.sqrt((x - r) ** 2 + (y - r) ** 2);
      if (dist <= r) circle.setPixelColor(img.getPixelColor(x, y), x, y);
    }
  }
  return circle.getBufferAsync(Jimp.MIME_PNG);
}

async function makeImage({ one, two }) {
  const pathImg = path.join(CANVAS_DIR, `pairing_${one}_${two}.png`);
  const avatarOne = path.join(CANVAS_DIR, `avt_${one}.png`);
  const avatarTwo = path.join(CANVAS_DIR, `avt_${two}.png`);

  const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
  const [resOne, resTwo] = await Promise.all([
    axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=${token}`, {
      responseType: "arraybuffer", timeout: 10000, headers: DL_HEADERS
    }),
    axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=${token}`, {
      responseType: "arraybuffer", timeout: 10000, headers: DL_HEADERS
    })
  ]);

  fs.writeFileSync(avatarOne, Buffer.from(resOne.data));
  fs.writeFileSync(avatarTwo, Buffer.from(resTwo.data));

  const [bg, bufOne, bufTwo] = await Promise.all([
    Jimp.read(BG_PATH),
    circularBuffer(avatarOne),
    circularBuffer(avatarTwo)
  ]);

  const [circleOne, circleTwo] = await Promise.all([
    Jimp.read(bufOne),
    Jimp.read(bufTwo)
  ]);

  bg.composite(circleOne.resize(85, 85), 355, 100)
    .composite(circleTwo.resize(75, 75), 250, 140);

  const raw = await bg.getBufferAsync(Jimp.MIME_PNG);
  fs.writeFileSync(pathImg, raw);

  fs.unlink(avatarOne).catch(() => {});
  fs.unlink(avatarTwo).catch(() => {});

  return pathImg;
}

module.exports = {
  config: {
    name: "pair",
    version: "1.1.0",
    author: "tdunguwu - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Randomly pair yourself with a group member 💑" },
    category: "img"
  },

  onLoad: async function () {
    await fs.ensureDir(CANVAS_DIR);
    if (!fs.existsSync(BG_PATH)) await downloadBG();
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    if (!await checkCooldown("pair", senderID, api, threadID)) return;

    try {
      const percentList = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', '0%', '48%'];
      const matchRate = percentList[Math.floor(Math.random() * percentList.length)];

      const [senderInfo, threadInfo] = await Promise.all([
        api.getUserInfo(senderID),
        api.getThreadInfo(threadID)
      ]);

      const senderName = senderInfo[senderID]?.name || "You";

      const participants = threadInfo.participantIDs.filter(id => id !== senderID);
      if (!participants.length) {
        return api.sendMessage("❗ There's no one else in the group to pair with!", threadID, messageID);
      }

      const pairedID = participants[Math.floor(Math.random() * participants.length)];
      const pairedInfo = await api.getUserInfo(pairedID);
      const pairedName = pairedInfo[pairedID]?.name || "Someone";

      if (!fs.existsSync(BG_PATH)) {
        const ok = await downloadBG();
        if (!ok) return api.sendMessage("❌ Background image unavailable. Please try again later.", threadID, messageID);
      }

      const imgPath = await makeImage({ one: senderID, two: pairedID });

      await api.sendMessage(
        {
          body: `💑 Congrats! ${senderName} has been paired with ${pairedName}\n💘 Match rate: ${matchRate}`,
          mentions: [
            { tag: senderName, id: senderID },
            { tag: pairedName, id: pairedID }
          ],
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => fs.unlink(imgPath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[pair] Error:", err.message);
      return api.sendMessage("❌ Failed to generate pair. Please try again.", threadID, messageID);
    }
  }
};
