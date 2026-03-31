const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const dirCanvas = path.resolve(__dirname, "cache", "canvas");
const bgPath = path.resolve(dirCanvas, "batgiam.png");

(async () => {
  try {
    fs.ensureDirSync(dirCanvas);
    if (!fs.existsSync(bgPath)) {
      const res = await axios.get("https://i.imgur.com/ep1gG3r.png", { responseType: "arraybuffer" });
      fs.writeFileSync(bgPath, Buffer.from(res.data));
    }
  } catch (e) {}
})();

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
    `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
    { responseType: "arraybuffer" }
  )).data;
  fs.writeFileSync(avatarOne, Buffer.from(avt1Data));

  const avt2Data = (await axios.get(
    `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
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

    const tag = event.mentions[mention].replace("@", "");
    const imgPath = await makeImage({ one: senderID, two: mention });
    return api.sendMessage(
      {
        body: `Congratulations on entering the state payroll ${tag}\nWish you happy`,
        mentions: [{ tag, id: mention }],
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );
  }
};
