const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

const CANVAS_DIR = path.join(__dirname, "cache", "canvas");
const BG_PATH = path.join(CANVAS_DIR, "pairing.png");
const BG_URL = "https://i.postimg.cc/X7R3CLmb/267378493-3075346446127866-4722502659615516429-n.png";

const TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

async function downloadBG() {
  await fs.ensureDir(CANVAS_DIR);
  try {
    const res = await axios.get(BG_URL, { responseType: "arraybuffer", timeout: 12000 });
    fs.writeFileSync(BG_PATH, Buffer.from(res.data));
    return true;
  } catch (err) {
    console.warn("[pairv2] Failed to download BG:", err.message);
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
  const pathImg = path.join(__root, `pairing_${one}_${two}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  const [resOne, resTwo] = await Promise.all([
    axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer" }),
    axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer" })
  ]);

  fs.writeFileSync(avatarOne, Buffer.from(resOne.data, "utf-8"));
  fs.writeFileSync(avatarTwo, Buffer.from(resTwo.data, "utf-8"));

  const [pairing_img, bufOne, bufTwo] = await Promise.all([
    Jimp.read(BG_PATH),
    circle(avatarOne),
    circle(avatarTwo)
  ]);

  const [circleOne, circleTwo] = await Promise.all([
    Jimp.read(bufOne),
    Jimp.read(bufTwo)
  ]);

  pairing_img
    .composite(circleOne.resize(150, 150), 980, 200)
    .composite(circleTwo.resize(150, 150), 140, 200);

  const raw = await pairing_img.getBufferAsync(Jimp.MIME_PNG);
  fs.writeFileSync(pathImg, raw);

  fs.unlink(avatarOne).catch(() => {});
  fs.unlink(avatarTwo).catch(() => {});

  return pathImg;
}

module.exports = {
  config: {
    name: "pairv2",
    version: "1.0.1",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "" },
    category: "Picture",
    usages: ""
  },

  onLoad: async function () {
    await fs.ensureDir(CANVAS_DIR);
    if (!fs.existsSync(BG_PATH)) await downloadBG();
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    try {
      if (!fs.existsSync(BG_PATH)) {
        const ok = await downloadBG();
        if (!ok) return api.sendMessage("❌ Background image unavailable. Please try again later.", threadID, messageID);
      }

      var tl = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', "0%", "48%"];
      var tle = tl[Math.floor(Math.random() * tl.length)];

      let dataa = await api.getUserInfo(senderID);
      let namee = dataa[senderID].name;

      let loz = await api.getThreadInfo(threadID);
      var emoji = loz.participantIDs;
      var id = emoji[Math.floor(Math.random() * emoji.length)];

      let data = await api.getUserInfo(id);
      let name = data[id].name;

      var arraytag = [];
      arraytag.push({ id: senderID, tag: namee });
      arraytag.push({ id: id, tag: name });

      var one = senderID, two = id;
      const imgPath = await makeImage({ one, two });

      return api.sendMessage(
        {
          body: `Congratulations ${namee} is paired with ${name} \n ️The odds are: 〘${tle}〙`,
          mentions: arraytag,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => fs.unlink(imgPath).catch(() => {}),
        messageID
      );
    } catch (err) {
      console.error("[pairv2] Error:", err.message);
      return api.sendMessage("❌ Failed to generate pair. Please try again.", threadID, messageID);
    }
  }
};
