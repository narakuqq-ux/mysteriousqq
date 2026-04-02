module.exports = {
  config: {
    name: "goiadmin",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    description: {
      en: "Automatically responds when admin is tagged or name is mentioned"
    },
    category: "events",
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, mentions } = event;
    if (!body && (!mentions || Object.keys(mentions).length === 0)) return;

    const adminIDs = global.GoatBot?.config?.adminBot || [];

    const tagReplies = [
      "Don't tag my admin he's busy 😗",
      "My admin is currently sleeping 😪",
      "Wag mo i-tag admin ko gagu, baka mabigawasan kita 😠 ",
      "My admin is busy right now 🤪"
    ];

    const nameReplies = [
      "Busy po ang owner ko 🫩"
    ];

    const taggedAdminIDs = Object.keys(mentions || {});
    const isAdminTagged = taggedAdminIDs.some(id => adminIDs.includes(id));

    const lowerBody = (body || "").toLowerCase();
    const isNameMentioned = ["sieg", "siegfried"].some(k => lowerBody.includes(k));

    if (isAdminTagged) {
      const reply = tagReplies[Math.floor(Math.random() * tagReplies.length)];
      return api.sendMessage(reply, threadID, messageID);
    }

    if (isNameMentioned) {
      const reply = nameReplies[Math.floor(Math.random() * nameReplies.length)];
      return api.sendMessage(reply, threadID, messageID);
    }
  }
};
