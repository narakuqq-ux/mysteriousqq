module.exports = {
  config: {
    name: "lc",
    version: "1.0.2",
    author: "Siegfried Samá",
    countDown: 1,
    role: 0,
    description: { en: "Responds to 'lc' or 'lastchat' with a memorial message" },
    category: "events"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const msg = body.toLowerCase().trim();

    if (
      msg.startsWith("lc") ||
      msg.startsWith("lastchat") ||
      msg.startsWith("last chat")
    ) {
      return api.sendMessage(
        "╭────༺♡༻────╮\n" +
        "       In Loving Memories\n" +
        "        —𝐋𝐀𝐒𝐓 𝐂𝐇𝐀𝐓—\n" +
        "╰────༺♡༻────╯",
        threadID,
        messageID
      );
    }
  }
};
