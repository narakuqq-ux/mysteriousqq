const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");

function wrapText(ctx, text, maxWidth) {
  return new Promise(resolve => {
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);
    const words = text.split(' ');
    const lines = [];
    let line = '';
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
        line = '';
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
}

module.exports = {
  config: {
    name: "siegfried",
    version: "3.0.1",
    author: "Siegfried Sama",
    countDown: 10,
    role: 0,
    description: { en: "Comment on the board" },
    category: "edit-img",
    guide: { en: "{pn} [text]" }
  },

  onStart: async function ({ api, event, args }) {
    const { senderID, threadID, messageID } = event;
    const bgPath = __dirname + '/cache/siegfried_bg.jpg';
    const pathImg = __dirname + '/cache/trump.png';
    const text = args.join(" ");

    if (!text) return api.sendMessage("Enter the content of the comment on the board", threadID, messageID);

    fs.copyFileSync(bgPath, pathImg);

    let baseImage = await loadImage(pathImg);
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";
    const maxWidth = Math.floor(canvas.width * 0.92);
    let fontSize = Math.floor(canvas.width * 0.035) + 2;
    ctx.font = `400 ${fontSize}px Arial`;
    while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
      fontSize--;
      ctx.font = `400 ${fontSize}px Arial`;
    }
    const lines = await wrapText(ctx, text, maxWidth);
    if (!lines) return api.sendMessage("Text is too long or too wide to fit.", threadID, messageID);
    const startX = Math.floor(canvas.width * 0.015);
    const lineSpacing = Math.floor(fontSize * 0.3);
    const lineHeight = fontSize + lineSpacing;
    const totalTextHeight = lines.length * lineHeight;
    const contentTop = Math.floor(canvas.height * 0.35);
    const contentBottom = Math.floor(canvas.height * 0.72);
    const contentMid = (contentTop + contentBottom) / 2;
    const startY = Math.floor(contentMid - totalTextHeight / 2) + fontSize;
    let y = startY;
    for (const line of lines) {
      ctx.fillText(line, startX, y);
      y += lineHeight;
    }
    ctx.beginPath();
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    return api.sendMessage({ attachment: fs.createReadStream(pathImg) }, threadID, () => fs.unlinkSync(pathImg), messageID);
  }
};
