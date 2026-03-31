module.exports = {
  config: {
    name: "hi",
    version: "1.0.0",
    author: "Sam - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Responds to hi/hello greetings with a sticker. Use /hi to toggle on/off." },
    category: "events",
    usages: ""
  },

  langs: {
    en: {
      on: "on",
      off: "off",
      successText: "hi success!"
    },
    vi: {
      on: "Bật",
      off: "Tắt",
      successText: "hi thành công"
    }
  },

  onStart: async function ({ api, event, threadsData, getLang }) {
    const { threadID, messageID } = event;
    const hiEnabled = await threadsData.get(threadID, "data.hi");
    const newValue = (hiEnabled === false) ? true : false;
    await threadsData.set(threadID, newValue, "data.hi");
    return api.sendMessage(
      `${newValue ? getLang("on") : getLang("off")} ${getLang("successText")}`,
      threadID,
      messageID
    );
  },

  onChat: async function ({ api, event, usersData, threadsData }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const hiEnabled = await threadsData.get(threadID, "data.hi");
    if (hiEnabled === false) return;

    const KEY = [
      "hello", "hi", "hello po", "hi po", "hiii", "helloo",
      "loe", "low", "lo", "hey", "heyy", "loe po", "low po",
      "hai", "chào", "chao", "hí", "híí", "hì", "hìì", "lô",
      "helo", "hê nhô", "yo", "wazzup", "wassup", "2", "hola"
    ];
    if (!KEY.includes(body.toLowerCase())) return;

    const stickers = [
      "422812141688367", "1775288509378520", "476426593020937", "476420733021523",
      "147663618749235", "466041158097347", "1528732074026137", "147663618749235",
      "476426753020921", "529233794205649", "1330360453820546"
    ];
    const sticker = stickers[Math.floor(Math.random() * stickers.length)];

    const phrases = [
      "have you eaten?", "what are you doing?", "how are you senpai?",
      "I'm a chat bot nice to meet you", "I'm updating my commands, what are you doing?",
      "Can you interact with me using sim command?", "You're so beautiful/handsome binibini/ginoo",
      "I love you mwa */kiss your forehead.", "are you bored? talk to my admin",
      "how are you my dear", "eat some sweets", "are you ok?", "be safe", ""
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    const moment = require("moment-timezone");
    const hours = parseInt(moment.tz("Asia/Manila").format("HHmm"));
    let session;
    if (hours > 1 && hours <= 400) session = "bright morning";
    else if (hours > 400 && hours <= 1100) session = "morning";
    else if (hours > 1100 && hours <= 1500) session = "afternoon";
    else if (hours > 1500 && hours <= 2100) session = "evening";
    else session = "late night and advance sleepwel";

    const name = await usersData.getName(event.senderID);
    api.sendMessage(
      { body: `Hi ${name}, have a good ${session} senpai, ${phrase}`, mentions: [{ tag: name, id: event.senderID }] },
      threadID,
      () => { setTimeout(() => { api.sendMessage({ sticker }, threadID); }, 100); },
      messageID
    );
  }
};
