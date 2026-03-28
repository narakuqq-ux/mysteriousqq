const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

const CANVAS_DIR = path.join(__dirname, "cache", "canvas");
const BG_PATH = path.join(CANVAS_DIR, "fingeringv2.png");
const BG_URL = "https://i.imgur.com/CQQZusa.jpeg";

async function circle(imagePath) {
  const img = await jimp.read(imagePath);
  img.circle();
  return img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const pathImg = path.join(CANVAS_DIR, `finger_${one}_${two}.png`);
  const avatarOne = path.join(CANVAS_DIR, `avt_${one}.png`);
  const avatarTwo = path.join(CANVAS_DIR, `avt_${two}.png`);

  const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
  const [resOne, resTwo] = await Promise.all([
    axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=${token}`, { responseType: "arraybuffer" }),
    axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=${token}`, { responseType: "arraybuffer" })
  ]);

  fs.writeFileSync(avatarOne, Buffer.from(resOne.data));
  fs.writeFileSync(avatarTwo, Buffer.from(resTwo.data));

  const [bg, circleOne, circleTwo] = await Promise.all([
    jimp.read(BG_PATH),
    jimp.read(await circle(avatarOne)),
    jimp.read(await circle(avatarTwo))
  ]);

  bg.composite(circleOne.resize(70, 70), 180, 110)
    .composite(circleTwo.resize(70, 70), 120, 140);

  const raw = await bg.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);
  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

module.exports = {
  config: {
    name: "finger",
    version: "1.0.1",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: {
      en: "Finger someone using their profile picture"
    },
    category: "nsfw",
    guide: {
      en: "{pn} @mention"
    }
  },

  onLoad: async function () {
    await fs.ensureDir(CANVAS_DIR);
    if (!fs.existsSync(BG_PATH)) {
      try {
        const res = await axios.get(BG_URL, { responseType: "arraybuffer", timeout: 10000 });
        fs.writeFileSync(BG_PATH, Buffer.from(res.data));
      } catch (err) {
        console.warn("[finger] Could not download background image at startup:", err.message);
      }
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions || {});

    if (!mention[0]) {
      return api.sendMessage("❗ Please mention 1 person to use this command.", threadID, messageID);
    }

    try {
      // Download BG if not yet available (e.g. was rate-limited at startup)
      if (!fs.existsSync(BG_PATH)) {
        const res = await axios.get(BG_URL, { responseType: "arraybuffer", timeout: 10000 });
        fs.writeFileSync(BG_PATH, Buffer.from(res.data));
      }

      const imgPath = await makeImage({ one: senderID, two: mention[0] });
      await api.sendMessage(
        { body: "", attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlink(imgPath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[finger] Error:", err.message);
      return api.sendMessage("❌ Failed to generate image. Please try again.", threadID, messageID);
    }
  }
};
