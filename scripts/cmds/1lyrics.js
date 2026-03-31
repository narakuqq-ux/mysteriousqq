const axios = require("axios");

module.exports = {
  config: {
    name: "lyrics",
    version: "1.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    category: "music",
    description: { en: "Get lyrics of a song." },
    guide: { en: "{pn} <song title>" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    if (!query) return api.sendMessage("Please enter a song title.\nExample: /lyrics shape of you", threadID, messageID);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      const res = await axios.get(`https://www.smfahim.xyz/ai/lyrics/v1?prompt=${encodeURIComponent(query)}`);
      const data = res.data;

      if (!data.success || !data.lyrics) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ Lyrics not found for that song.", threadID, messageID);
      }

      const title = data.lyrics.title || query;
      const text = data.lyrics.text || "No lyrics available.";

      const msg = `🎵 ${title}\n\n${text}`;

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ Failed to fetch lyrics. Please try again.", threadID, messageID);
    }
  }
};
