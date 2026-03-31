module.exports = {
  config: {
    name: "afternoon",
    version: "7.3.1",
    author: "John Lester - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Just Respond" },
    category: "events"
  },

  onStart: async function () {},

  onChat: async function ({ api, event, usersData }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const lower = body.toLowerCase();
    const triggers = ["good afternoon", "afternoon", "magandang hapon"];
    if (!triggers.some(t => lower.startsWith(t))) return;

    const name = await usersData.getName(event.senderID);
    api.sendMessage(`Good Afternoon ${name} ❤️`, threadID, messageID);
    api.setMessageReaction("❤️", messageID, (err) => {}, true);
  }
};
