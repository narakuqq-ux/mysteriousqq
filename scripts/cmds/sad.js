module.exports = {
  config: {
    name: "sad",
    version: "1.1.1",
    author: "John Lester - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Responds to sad messages" },
    category: "events"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;
    const lower = body.toLowerCase();
    const keywords = [
      "sakit", "saket", "peyn", "pain", "mamatay", "ayaw ko na",
      "saktan", "sasaktan", "sad", "malungkot", "😥", "😰", "😨",
      "😢", ":(", "😔", "😞", "depress", "stress", "depression",
      "kalungkutan", "😭"
    ];
    if (!keywords.some(k => lower.includes(k))) return;
    api.sendMessage("cheer up", threadID, messageID);
    api.setMessageReaction("😢", messageID, () => {}, true);
  }
};
