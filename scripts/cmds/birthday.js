module.exports = {
  config: {
    name: "birthday",
    version: "1.0.3",
    author: "Siegfried Samá",
    countDown: 1,
    role: 0,
    description: { en: "Auto replies with a birthday message when birthday keywords are detected" },
    category: "events"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const msg = body.toLowerCase().trim();
    const KEYWORDS = [
      "happy birthday",
      "happy bday",
      "hbd",
      "advance happy birthday",
      "advance hbd"
    ];
    if (!KEYWORDS.some(k => msg.startsWith(k) || msg.includes(k))) return;

    const text = "🎂 HAPPY BIRTHDAY from Siegfried Samá 🥐🥐🥐\nand your Family — may you have the best day ever! 🎉🎈";
    return api.sendMessage(text, threadID, messageID);
  }
};
