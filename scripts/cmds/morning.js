module.exports = {
  config: {
    name: "morning",
    version: "1.0",
    author: "John Lester - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Responds to good morning greetings" },
    category: "events"
  },

  onStart: async function () {},

  onChat: async function ({ api, event, usersData }) {
    const { threadID, messageID, body } = event;
    if (!body) return;
    const lower = body.toLowerCase();
    const triggers = ["good morning", "morning", "magandang umaga"];
    if (!triggers.some(t => lower.startsWith(t))) return;
    const name = await usersData.getName(event.senderID);
    api.sendMessage(`Good Morning ${name} ❤️`, threadID, messageID);
    api.setMessageReaction("❤️", messageID, () => {}, true);
  }
};
