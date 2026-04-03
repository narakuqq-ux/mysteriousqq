const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const checkCooldown = require('./utils/mediaCooldown');

const cacheDir = path.resolve(__dirname, "cache");
const bgCachePath = path.join(cacheDir, "billboard_bg.jpg");
const BG_URL = "https://i.imgur.com/aOZUbNm.jpg";

function wrapText(ctx, text, maxWidth) {
  return new Promise(resolve => {
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText("W").width > maxWidth) return resolve(null);
    const words = text.split(" ");
    const lines = [];
    let line = "";
    while (words.length > 0) {
      let split = false;
      while (ctx.measureText(words[0]).width >= maxWidth) {
        const temp = words[0];
        words[0] = temp.slice(0, -1);
        if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
        else {
          split = true;
          words.splice(1, 0, temp.slice(-1));
        }
      }
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = "";
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
}

async function ensureBg() {
  fs.ensureDirSync(cacheDir);
  if (!fs.existsSync(bgCachePath)) {
    const res = await axios.get(BG_URL, { responseType: "arraybuffer" });
    fs.writeFileSync(bgCachePath, Buffer.from(res.data));
  }
}

module.exports = {
  config: {
    name: "billboard",
    version: "9.7.5",
    author: "John Lester - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Put text on a billboard image" },
    category: "image",
    usages: "[text]"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const senderID = event.senderID;
    if (!await checkCooldown("billboard", senderID, api, threadID)) return;
    const { loadImage, createCanvas } = require("canvas");
    const text = args.join(" ");
    if (!text) return api.sendMessage("Enter the content of the comment on the board", threadID, messageID);

    try {
      await ensureBg();
    } catch (e) {
      return api.sendMessage("❌ Failed to load billboard background. Please try again later.", threadID, messageID);
    }

    const pathImg = path.join(cacheDir, `billboard_${Date.now()}.jpg`);
    fs.copyFileSync(bgCachePath, pathImg);

    const baseImage = await loadImage(pathImg);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";

    const MAX_WIDTH = 420;
    const TEXT_X = 330;
    const TEXT_Y_START = 75;
    const LINE_HEIGHT_RATIO = 1.2;

    let fontSize = 90;
    ctx.font = `bold ${fontSize}px Arial`;

    while (fontSize > 20) {
      const measured = ctx.measureText(text).width;
      if (measured <= MAX_WIDTH) break;
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px Arial`;
    }

    const lines = await wrapText(ctx, text, MAX_WIDTH);
    if (!lines) return api.sendMessage("❌ Text too long for the billboard.", threadID, messageID);

    const lineHeight = fontSize * LINE_HEIGHT_RATIO;
    const totalHeight = lines.length * lineHeight;
    let startY = TEXT_Y_START + (lineHeight / 2);

    if (lines.length > 1) {
      startY = TEXT_Y_START + (lineHeight * 0.3);
    }

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], TEXT_X, startY + i * lineHeight);
    }

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    return api.sendMessage(
      { attachment: fs.createReadStream(pathImg) },
      threadID,
      () => { if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg); },
      messageID
    );
  }
};
