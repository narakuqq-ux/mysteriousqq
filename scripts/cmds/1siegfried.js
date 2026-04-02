const axios = require("axios");
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
    const pathImg = __dirname + '/cache/trump.png';
    const text = args.join(" ");

    if (!text) return api.sendMessage("Enter the content of the comment on the board", threadID, messageID);

    const getPorn = (await axios.get(`https://imgur.com/7wzZMN2.jpg`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(pathImg, Buffer.from(getPorn, 'utf-8'));

    let baseImage = await loadImage(pathImg);
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.font = "400 45px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";
    let fontSize = 50;
    while (ctx.measureText(text).width > 1200) {
      fontSize--;
      ctx.font = `400 ${fontSize}px Arial`;
    }
    const lines = await wrapText(ctx, text, 1000);
    ctx.fillText(lines.join('\n'), 50, 180);
    ctx.beginPath();
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    return api.sendMessage({ attachment: fs.createReadStream(pathImg) }, threadID, () => fs.unlinkSync(pathImg), messageID);
  }
};
