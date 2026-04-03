const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");
const checkCooldown = require('./utils/mediaCooldown');

const CANVAS_DIR = path.join(__dirname, "cache", "canvas");
const BG_PATH = path.join(CANVAS_DIR, "hugv1.png");

const BG_URLS = [
  "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg",
  "https://i.postimg.cc/3YN3T1r/q1y28eqblsr21.jpg"
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
      console.log("[hug] Background downloaded from:", url);
      return true;
    } catch (err) {
      console.warn(`[hug] Failed BG from ${url}: ${err.message}`);
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
  const pathImg = path.join(CANVAS_DIR, `hug_${one}_${two}.png`);
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

  bg.composite(circleOne.resize(150, 150), 320, 100)
    .composite(circleTwo.resize(130, 130), 280, 280);

  const raw = await bg.getBufferAsync(Jimp.MIME_PNG);
  fs.writeFileSync(pathImg, raw);

  fs.unlink(avatarOne).catch(() => {});
  fs.unlink(avatarTwo).catch(() => {});

  return pathImg;
}

module.exports = {
  config: {
    name: "hug",
    version: "3.1.2",
    author: "John Lester - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Hug someone 🥰" },
    category: "img",

  },

  onLoad: async function () {
    await fs.ensureDir(CANVAS_DIR);
    if (!fs.existsSync(BG_PATH)) await downloadBG();
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    if (!await checkCooldown("hug", senderID, api, threadID)) return;
    const mention = Object.keys(event.mentions || {});

    if (!mention[0]) {
      return api.sendMessage("❗ Please mention 1 person to use this command.", threadID, messageID);
    }

    try {
      if (!fs.existsSync(BG_PATH)) {
        const ok = await downloadBG();
        if (!ok) return api.sendMessage("❌ Background image unavailable. Please try again later.", threadID, messageID);
      }

      const imgPath = await makeImage({ one: senderID, two: mention[0] });
      await api.sendMessage(
        { body: "", attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlink(imgPath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[hug] Error:", err.message);
      return api.sendMessage("❌ Failed to generate image. Please try again.", threadID, messageID);
    }
  }
};
