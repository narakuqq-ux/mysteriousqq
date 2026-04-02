const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const dirCanvas = path.resolve(__dirname, "cache", "canvas");
const bgPath = path.resolve(dirCanvas, "batgiam.png");
const BG_URL = "https://i.imgur.com/ep1gG3r.png";

async function ensureBg() {
  fs.ensureDirSync(dirCanvas);
  if (!fs.existsSync(bgPath)) {
    const res = await axios.get(BG_URL, { responseType: "arraybuffer" });
    fs.writeFileSync(bgPath, Buffer.from(res.data));
  }
}

async function circle(imagePath) {
  const jimp = require("jimp");
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const jimp = require("jimp");
  const pathImg = path.join(dirCanvas, `batgiam_${one}_${two}.png`);
  const avatarOne = path.join(dirCanvas, `avt_${one}.png`);
  const avatarTwo = path.join(dirCanvas, `avt_${two}.png`);

  const avt1Data = (await axios.get(
    `https://graph.facebook.com/${one}/picture?width=512&height=512`,
    { responseType: "arraybuffer" }
  )).data;
  fs.writeFileSync(avatarOne, Buffer.from(avt1Data));

  const avt2Data = (await axios.get(
    `https://graph.facebook.com/${two}/picture?width=512&height=512`,
    { responseType: "arraybuffer" }
  )).data;
  fs.writeFileSync(avatarTwo, Buffer.from(avt2Data));

  const batgiam_img = await jimp.read(bgPath);
  const circleOne = await jimp.read(await circle(avatarOne));
  const circleTwo = await jimp.read(await circle(avatarTwo));

  batgiam_img
    .resize(500, 500)
    .composite(circleOne.resize(100, 100), 375, 9)
    .composite(circleTwo.resize(100, 100), 160, 92);

  const raw = await batgiam_img.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);
  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

module.exports = {
  config: {
    name: "arrest",
    version: "2.0.0",
    author: "Joshua Sy - Convert by Siegfried Samá",
    countDown: 2,
    role: 0,
    description: { en: "Arrest a friend you mention" },
    category: "image",
    usages: "[mention]"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions)[0];
    if (!mention) return api.sendMessage("Please mention 1 Person", threadID, messageID);

    try {
      await ensureBg();
    } catch (e) {
      return api.sendMessage("❌ Failed to load arrest background image. Please try again.", threadID, messageID);
    }

    const tag = event.mentions[mention].replace("@", "");
    const imgPath = await makeImage({ one: senderID, two: mention });
    return api.sendMessage(
      {
        body: `Congratulations on entering the state payroll ${tag}\nWish you happy`,
        mentions: [{ tag, id: mention }],
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); },
      messageID
    );
  }
};
