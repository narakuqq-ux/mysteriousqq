const { writeFileSync } = require("fs-extra");

const GOD_UIDS = ["100070646281323"];

module.exports = {
  config: {
    name: "god",
    version: "1.1.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 3,
    description: { en: "Manage the God list — highest authority above all admins" },
    category: "owner",
    guide: {
      en: "{pn} list — show God list\n{pn} add <uid | @tag> — add a user to the God list"
    }
  },

  onStart: async function ({ message, args, usersData, event }) {
    const sub = (args[0] || "").toLowerCase();

    if (sub === "list" || sub === "-l" || sub === "") {
      const getNames = await Promise.all(
        GOD_UIDS.map(uid =>
          usersData.getName(uid).then(name => ({ uid, name: name || "Siegfried Samá" }))
        )
      );

      const listStr = getNames
        .map(({ uid, name }) =>
          `╰┈➤ 👑 ${name} ˎˊ˗\n(${uid})`
        )
        .join("\n\u200E\n");

      return message.reply(
        `「 GOD LIST 」\n\u200E\n\u200E\n\u200E${listStr}`
      );
    }

    if (sub === "add" || sub === "-a") {
      let uids = [];
      if (Object.keys(event.mentions).length > 0)
        uids = Object.keys(event.mentions);
      else if (event.messageReply)
        uids.push(event.messageReply.senderID);
      else
        uids = args.slice(1).filter(arg => !isNaN(arg));

      if (uids.length === 0)
        return message.reply("⚠️ | Please enter a UID or tag a user to add to the God list.");

      const alreadyGod = [];
      const newGods = [];

      for (const uid of uids) {
        if (GOD_UIDS.includes(uid))
          alreadyGod.push(uid);
        else
          newGods.push(uid);
      }

      GOD_UIDS.push(...newGods);

      const getNames = await Promise.all(
        uids.map(uid =>
          usersData.getName(uid).then(name => ({ uid, name: name || uid }))
        )
      );

      let reply = "";
      if (newGods.length > 0) {
        const addedNames = getNames
          .filter(({ uid }) => newGods.includes(uid))
          .map(({ uid, name }) => `• 👑 ${name} (${uid})`).join("\n");
        reply += `✅ | Added ${newGods.length} user(s) to the God list:\n${addedNames}`;
      }
      if (alreadyGod.length > 0) {
        const existingNames = getNames
          .filter(({ uid }) => alreadyGod.includes(uid))
          .map(({ uid, name }) => `• ${name} (${uid})`).join("\n");
        reply += `${reply ? "\n" : ""}⚠️ | ${alreadyGod.length} user(s) are already in the God list:\n${existingNames}`;
      }

      return message.reply(reply);
    }

    return message.reply(
      "Usage:\n/god list — show God list\n/god add <uid | @tag> — add a user to the God list"
    );
  }
};
