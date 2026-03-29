module.exports = {
  config: {
    name: "bye",
    version: "1.0.2",
    author: "Siegfried Samá",
    countDown: 1,
    role: 0,
    description: { en: "Replies when someone says bye, brb, maya nalang" },
    category: "box chat"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const text = body.trim().toLowerCase();
    const triggers = ["maya nalang", "brb", "bye", "good bye", "goodbye", "ingat", "paalam"];
    const triggered = triggers.some(t => text.startsWith(t));
    if (!triggered) return;

    await new Promise((resolve) => {
      api.sendMessage("take your time.", threadID, resolve, messageID);
    });

    setTimeout(() => {
      api.sendMessage({ sticker: "162332973951561" }, threadID, null, messageID);
    }, 500);
  }
};
