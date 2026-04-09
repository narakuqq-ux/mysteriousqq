const GOD_UIDS = ["100070646281323"];

module.exports = {
  config: {
    name: "god",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Show the God list — highest authority above all admins" },
    category: "owner",
    guide: { en: "{pn} list — show God list" }
  },

  onStart: async function ({ message, args, usersData }) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "list" || sub === "-l" || sub === "") {
      const getNames = await Promise.all(
        GOD_UIDS.map(uid =>
          usersData.getName(uid).then(name => ({ uid, name: name || "Siegfried Samá" }))
        )
      );

      const listStr = getNames
        .map(({ uid, name }, i) =>
          `╰┈➤ 👑 ${name} ˎˊ˗\n(${uid})`
        )
        .join("\n\u200E\n");

      return message.reply(
        `「 GOD LIST 」\n\u200E\n\u200E\n\u200E${listStr}`
      );
    }

    return message.reply(
      "Usage:\n/god list — show God list"
    );
  }
};
