const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");
const Jimp  = require("jimp");

const CANVAS_DIR = path.join(__dirname, "cache", "canvas");
const BG_PATH    = path.join(CANVAS_DIR, "marriedv3.png");

const BG_URLS = [
  "https://i.ibb.co/5TwSHpP/Guardian-Place-full-1484178.jpg",
  "https://i.postimg.cc/5TwSHpP/Guardian-Place-full-1484178.jpg",
];

const DL_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept":     "image/webp,image/apng,image/*,*/*;q=0.8",
};

async function downloadBG() {
  await fs.ensureDir(CANVAS_DIR);
  for (const url of BG_URLS) {
    try {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000, headers: DL_HEADERS });
      fs.writeFileSync(BG_PATH, Buffer.from(res.data));
      console.log("[marryv2] BG downloaded:", url);
      return true;
    } catch (e) {
      console.warn("[marryv2] BG fail:", url, e.message);
    }
  }
  return false;
}

async function circularBuffer(imgPath) {
  const img  = await Jimp.read(imgPath);
  const size = Math.min(img.getWidth(), img.getHeight());
  img.resize(size, size);
  const circle = new Jimp(size, size, 0x00000000);
  const r = size / 2;
  for (let x = 0; x < size; x++)
    for (let y = 0; y < size; y++)
      if (Math.sqrt((x - r) ** 2 + (y - r) ** 2) <= r)
        circle.setPixelColor(img.getPixelColor(x, y), x, y);
  return circle.getBufferAsync(Jimp.MIME_PNG);
}

const TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

async function makeImage({ one, two }) {
  await fs.ensureDir(CANVAS_DIR);
  const pathImg   = path.join(CANVAS_DIR, `marryv2_${one}_${two}.png`);
  const avatarOne = path.join(CANVAS_DIR, `avt_${one}.png`);
  const avatarTwo = path.join(CANVAS_DIR, `avt_${two}.png`);

  const [resOne, resTwo] = await Promise.all([
    axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=${TOKEN}`, { responseType: "arraybuffer", timeout: 10000, headers: DL_HEADERS }),
    axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=${TOKEN}`, { responseType: "arraybuffer", timeout: 10000, headers: DL_HEADERS }),
  ]);
  fs.writeFileSync(avatarOne, Buffer.from(resOne.data));
  fs.writeFileSync(avatarTwo, Buffer.from(resTwo.data));

  const [bg, bufOne, bufTwo] = await Promise.all([
    Jimp.read(BG_PATH),
    circularBuffer(avatarOne),
    circularBuffer(avatarTwo),
  ]);
  const [circleOne, circleTwo] = await Promise.all([Jimp.read(bufOne), Jimp.read(bufTwo)]);

  bg.composite(circleOne.resize(90, 90), 250, 1)
    .composite(circleTwo.resize(90, 90), 350, 70);

  const raw = await bg.getBufferAsync(Jimp.MIME_PNG);
  fs.writeFileSync(pathImg, raw);
  fs.unlink(avatarOne).catch(() => {});
  fs.unlink(avatarTwo).catch(() => {});
  return pathImg;
}

module.exports = {
  config: {
    name: "marryv2",
    version: "2.0.0",
    author: "Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Ikasal sa isang tao 💍 v2" },
    category: "img",
    guide: { en: "{pn} @mention" },
  },

  onLoad: async function () {
    await fs.ensureDir(CANVAS_DIR);
    if (!fs.existsSync(BG_PATH)) await downloadBG();
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    const mentions = Object.keys(event.mentions || {});

    if (!mentions[0])
      return api.sendMessage("❗ I-mention ang taong gusto mong pakasalan!", threadID, messageID);

    try {
      if (!fs.existsSync(BG_PATH)) {
        const ok = await downloadBG();
        if (!ok) return api.sendMessage("❌ Background unavailable. Try again later.", threadID, messageID);
      }

      const targetID   = mentions[0];
      const targetName = (event.mentions[targetID] || "").replace("@", "").trim();
      let senderName;
      try { senderName = await usersData.getName(senderID); } catch (e) { senderName = "Someone"; }

      const imgPath = await makeImage({ one: senderID, two: targetID });
      await api.sendMessage(
        {
          body: `💍 ${senderName} at @${targetName} ay ikinasal na! Maligayang buhay kasama! 🎊`,
          mentions: [{ tag: `@${targetName}`, id: targetID }],
          attachment: fs.createReadStream(imgPath),
        },
        threadID,
        () => fs.unlink(imgPath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[marryv2] Error:", err.message);
      return api.sendMessage("❌ Hindi makagawa ng image. Subukan ulit!", threadID, messageID);
    }
  },
};
