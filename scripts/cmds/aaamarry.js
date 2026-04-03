const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

const CANVAS_DIR = path.resolve(__dirname, "cache", "canvas");
const MARRIED_BG = path.join(CANVAS_DIR, "married.png");
const BG_URL = "https://i.ibb.co/PjWvsBr/13bb9bb05e53ee24893940892b411ad2.png";

async function circle(imagePath) {
  const img = await Jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage(one, two) {
  if (!fs.existsSync(CANVAS_DIR)) fs.mkdirSync(CANVAS_DIR, { recursive: true });
  if (!fs.existsSync(MARRIED_BG)) {
    const res = await axios.get(BG_URL, { responseType: "arraybuffer" });
    fs.writeFileSync(MARRIED_BG, Buffer.from(res.data));
  }

  const avatarOne = path.join(CANVAS_DIR, `avt_${one}.png`);
  const avatarTwo = path.join(CANVAS_DIR, `avt_${two}.png`);
  const output = path.join(CANVAS_DIR, `married_${one}_${two}.png`);

  const getAvatar = async (uid, dest) => {
    const res = await axios.get(
      `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    );
    fs.writeFileSync(dest, Buffer.from(res.data));
  };

  await Promise.all([getAvatar(one, avatarOne), getAvatar(two, avatarTwo)]);

  const bg = await Jimp.read(MARRIED_BG);
  const circleOneBuffer = await circle(avatarOne);
  const circleTwoBuffer = await circle(avatarTwo);
  const imgOne = await Jimp.read(circleOneBuffer);
  const imgTwo = await Jimp.read(circleTwoBuffer);

  bg.composite(imgOne.resize(150, 150), 280, 45)
    .composite(imgTwo.resize(150, 150), 130, 90);

  const raw = await bg.getBufferAsync("image/png");
  fs.writeFileSync(output, raw);

  try { fs.unlinkSync(avatarOne); } catch (e) {}
  try { fs.unlinkSync(avatarTwo); } catch (e) {}

  return output;
}

module.exports = {
  config: {
    name: "marry",
    version: "3.1.2",
    author: "John Lester - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Marry someone with a cute card" },
    category: "img",
    guide: { en: "{pn} @mention" }
  },

  onStart: async function ({ api, event, message }) {
    const { threadID, messageID, senderID } = event;
    if (!global.mediaCooldown) global.mediaCooldown = new Map();
    const _mNow = Date.now(), _mLast = global.mediaCooldown.get(senderID) || 0;
    if (_mNow - _mLast < 5000) return api.sendMessage("please wait 5 seconds before using this command to avoid overloaded", threadID, messageID);
    global.mediaCooldown.set(senderID, _mNow);
    const mention = Object.keys(event.mentions || {});

    if (!mention[0]) {
      return message.reply("tag mo yung gusto mong i-marry!");
    }

    const one = senderID;
    const two = mention[0];

    try {
      const imgPath = await makeImage(one, two);
      await new Promise((resolve) => {
        api.sendMessage(
          { body: "", attachment: fs.createReadStream(imgPath) },
          threadID,
          () => {
            try { fs.unlinkSync(imgPath); } catch (e) {}
            resolve();
          },
          messageID
        );
      });
    } catch (err) {
      return message.reply("may error sa paglikha ng card, subukan ulit.");
    }
  }
};
