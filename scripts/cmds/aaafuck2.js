const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

const CANVAS_DIR = path.join(__dirname, "cache", "canvas");
const BG_PATH = path.join(CANVAS_DIR, "fuckv4.png");
const BG_URL = "https://i.ibb.co/cxQhc3B/images-2022-08-14-T183846-226.jpg";

const TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

async function downloadBG() {
  await fs.ensureDir(CANVAS_DIR);
  try {
    const res = await axios.get(BG_URL, { responseType: "arraybuffer", timeout: 12000 });
    fs.writeFileSync(BG_PATH, Buffer.from(res.data));
    return true;
  } catch (err) {
    console.warn("[fuckv2] Failed to download BG:", err.message);
    return false;
  }
}

async function circle(imagePath) {
  const img = await Jimp.read(imagePath);
  img.circle();
  return img.getBufferAsync(Jimp.MIME_PNG);
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache", "canvas");
  const pathImg = path.join(__root, `batman${one}_${two}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  const [resOne, resTwo] = await Promise.all([
    axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer" }),
    axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer" })
  ]);

  fs.writeFileSync(avatarOne, Buffer.from(resOne.data, "utf-8"));
  fs.writeFileSync(avatarTwo, Buffer.from(resTwo.data, "utf-8"));

  const [batgiam_img, bufOne, bufTwo] = await Promise.all([
    Jimp.read(BG_PATH),
    circle(avatarOne),
    circle(avatarTwo)
  ]);

  const [circleOne, circleTwo] = await Promise.all([
    Jimp.read(bufOne),
    Jimp.read(bufTwo)
  ]);

  batgiam_img
    .composite(circleOne.resize(100, 100), 240, 30)
    .composite(circleTwo.resize(100, 100), 100, 200);

  const raw = await batgiam_img.getBufferAsync(Jimp.MIME_PNG);
  fs.writeFileSync(pathImg, raw);

  fs.unlink(avatarOne).catch(() => {});
  fs.unlink(avatarTwo).catch(() => {});

  return pathImg;
}

module.exports = {
  config: {
    name: "fuckv2",
    version: "3.1.1",
    author: "John Lester - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Get fuck" },
    category: "img",
    usages: "[@mention]"
  },

  onLoad: async function () {
    await fs.ensureDir(CANVAS_DIR);
    if (!fs.existsSync(BG_PATH)) await downloadBG();
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions || {});

    if (!mention[0]) return api.sendMessage("Please mention 1 person.", threadID, messageID);

    try {
      if (!fs.existsSync(BG_PATH)) {
        const ok = await downloadBG();
        if (!ok) return api.sendMessage("❌ Background image unavailable. Please try again later.", threadID, messageID);
      }

      const one = senderID, two = mention[0];
      const imgPath = await makeImage({ one, two });

      return api.sendMessage(
        { body: "", attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlink(imgPath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[fuckv2] Error:", err.message);
      return api.sendMessage("❌ Failed to generate image. Please try again.", threadID, messageID);
    }
  }
};
