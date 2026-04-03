const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

const CACHE_DIR = path.resolve(__dirname, "cache");
const KISS_BG = path.join(CACHE_DIR, "hon.png");
const BG_URL = "https://i.imgur.com/BtSlsSS.jpg";

async function circle(imagePath) {
  const img = await Jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage(one, two) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (!fs.existsSync(KISS_BG)) {
    const res = await axios.get(BG_URL, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.google.com/"
      },
      timeout: 20000
    });
    fs.writeFileSync(KISS_BG, Buffer.from(res.data));
  }

  const avatarOne = path.join(CACHE_DIR, `avt_${one}.png`);
  const avatarTwo = path.join(CACHE_DIR, `avt_${two}.png`);
  const output = path.join(CACHE_DIR, `hon_${one}_${two}.png`);

  const getAvatar = async (uid, dest) => {
    const res = await axios.get(
      `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    );
    fs.writeFileSync(dest, Buffer.from(res.data));
  };

  await Promise.all([getAvatar(one, avatarOne), getAvatar(two, avatarTwo)]);

  const bg = await Jimp.read(KISS_BG);
  const c1 = await Jimp.read(await circle(avatarOne));
  const c2 = await Jimp.read(await circle(avatarTwo));

  bg.resize(700, 440)
    .composite(c1.resize(200, 200), 390, 23)
    .composite(c2.resize(180, 180), 140, 80);

  fs.writeFileSync(output, await bg.getBufferAsync("image/png"));
  try { fs.unlinkSync(avatarOne); } catch (e) {}
  try { fs.unlinkSync(avatarTwo); } catch (e) {}

  return output;
}

module.exports = {
  config: {
    name: "kiss",
    version: "2.0.1",
    author: "DinhPhuc - Convert By Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Kiss someone" },
    category: "Love",
    guide: { en: "{pn} @mention" }
  },

  onStart: async function ({ api, event, message, Currencies }) {
    const { threadID, messageID, senderID } = event;
    if (!global.mediaCooldown) global.mediaCooldown = new Map();
    const _mNow = Date.now(), _mLast = global.mediaCooldown.get(senderID) || 0;
    if (_mNow - _mLast < 5000) return api.sendMessage("please wait 5 seconds before using this command to avoid overloaded", threadID, messageID);
    global.mediaCooldown.set(senderID, _mNow);
    const mention = Object.keys(event.mentions || {});

    if (!mention[0]) return message.reply("tag mo yung gustong i-kiss!");

    const one = senderID;
    const two = mention[0];
    const hc = Math.floor(Math.random() * 101) + 101;
    const rd = Math.floor(Math.random() * 10) + 1;
    const ae = ["💚Yeuanh❤", "💛Yeuem💜"];

    try {
      if (Currencies) await Currencies.increaseMoney(senderID, parseInt(hc * rd));
      const imgPath = await makeImage(one, two);
      await new Promise((resolve) => {
        api.sendMessage(
          {
            body: `${ae[Math.floor(Math.random() * ae.length)]}\nHorimism to you after being kissing is ${hc}%\n+${hc * rd}$`,
            attachment: fs.createReadStream(imgPath)
          },
          threadID,
          () => {
            try { fs.unlinkSync(imgPath); } catch (e) {}
            resolve();
          },
          messageID
        );
      });
    } catch (err) {
      return message.reply("may error, subukan ulit.");
    }
  }
};
