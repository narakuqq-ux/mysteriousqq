const LIKE_STICKER = 369239263222822;
const SPAM_COUNT = 20;

module.exports = {
  config: {
    name: "spam",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 30,
    role: 2,
    description: { en: "Spam 20 like emojis simultaneously" },
    category: "owner",
    guide: { en: "{pn} — spam 20 blue likes" }
  },

  onStart: async function ({ api, event }) {
    const { threadID } = event;

    const sends = [];
    for (let i = 0; i < SPAM_COUNT; i++) {
      sends.push(
        new Promise(resolve =>
          api.sendMessage({ sticker: LIKE_STICKER }, threadID, () => resolve())
        )
      );
    }

    await Promise.all(sends);
  }
};
