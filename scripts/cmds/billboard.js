const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

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
    const { loadImage, createCanvas } = require("canvas");
    const text = args.join(" ");
    if (!text) return api.sendMessage("Enter the content of the comment on the board", threadID, messageID);

    const cacheDir = path.resolve(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const pathImg = path.join(cacheDir, "fact.jpg");

    const imgData = (await axios.get("https://i.imgur.com/aOZUbNm.jpg", { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(imgData));

    const baseImage = await loadImage(pathImg);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    let fontSize = 40;
    ctx.font = `bold 400 ${fontSize}px Arial`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";

    while (ctx.measureText(text).width > 3800) {
      fontSize--;
      ctx.font = `bold 400 ${fontSize}px Arial`;
    }

    const lines = await wrapText(ctx, text, 500);
    ctx.fillText(lines.join("\n"), 330, 100);
    ctx.beginPath();

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    return api.sendMessage(
      { attachment: fs.createReadStream(pathImg) },
      threadID,
      () => fs.unlinkSync(pathImg),
      messageID
    );
  }
};
