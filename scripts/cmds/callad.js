module.exports = {
  config: {
    name: "callad",
    version: "1.0.2",
    author: "NTKhang, ManhG Fix Get",
    countDown: 5,
    role: 0,
    description: { en: "Report bot's error to admin or leave a comment" },
    category: "group",
    usages: "[Error encountered or comments]"
  },

  onStart: async function ({ api, event, args, usersData, threadsData }) {
    const { threadID, messageID, senderID } = event;
    if (!args[0]) return api.sendMessage("You have not entered the content to report", threadID, messageID);

    const name = await usersData.getName(senderID);
    const threadInfo = await threadsData.get(threadID);
    const threadName = (threadInfo && threadInfo.threadName) ? threadInfo.threadName : "Unknown";
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Manila").format("HH:mm:ss D/MM/YYYY");

    const admins = global.GoatBot.config.adminBot || [];

    const mentions = admins.map(id => ({ tag: "@Admin", id: String(id) }));
    const adminTags = admins.map(() => "@Admin").join(" ");

    const reportBody = `📢 Report received! ${adminTags}\n\n👤 From: ${name}\n👥 Group: ${threadName}\n🔰 Group ID: ${threadID}\n🔷 User ID: ${senderID}\n─────────────────\n⚠️ Message: ${args.join(" ")}\n─────────────────\n🕐 Time: ${time}\n\n💬 Reply to this message to respond to the user.`;

    api.sendMessage(`✅ Your report has been sent.\n🕐 Time: ${time}`, threadID, () => {
      api.sendMessage(
        { body: reportBody, mentions },
        threadID,
        (err, info) => {
          if (err || !info) return;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            messageID: info.messageID,
            author: senderID,
            senderName: name,
            sourceMessageID: messageID,
            sourceThreadID: threadID,
            type: "calladmin"
          });
        }
      );
    }, messageID);
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { threadID, messageID, senderID } = event;
    const name = await usersData.getName(senderID);
    const admins = (global.GoatBot.config.adminBot || []).map(String);

    if (Reply.type === "calladmin") {
      if (!admins.includes(String(senderID))) return;

      const replyBody = `📌 Admin reply from ${name}:\n─────────────────\n${event.body}\n─────────────────\n💬 Reply to this message to continue.`;

      api.sendMessage(
        { body: replyBody, mentions: [{ tag: name, id: senderID }] },
        Reply.sourceThreadID,
        (err, info) => {
          if (err || !info) return;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            messageID: info.messageID,
            author: Reply.author,
            senderName: Reply.senderName,
            adminID: senderID,
            adminName: name,
            sourceMessageID: messageID,
            sourceThreadID: threadID,
            type: "reply"
          });
        },
        Reply.sourceMessageID
      );
    }
    else if (Reply.type === "reply") {
      const mentions = admins.map(id => ({ tag: "@Admin", id }));
      const adminTags = admins.map(() => "@Admin").join(" ");

      const followUp = `📄 Follow-up from ${name}: ${adminTags}\n─────────────────\n${event.body}\n─────────────────\n💬 Reply to this message to respond.`;

      api.sendMessage(
        { body: followUp, mentions },
        Reply.sourceThreadID,
        (err, info) => {
          if (err || !info) return;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            messageID: info.messageID,
            author: senderID,
            senderName: name,
            sourceMessageID: messageID,
            sourceThreadID: threadID,
            type: "calladmin"
          });
        }
      );
    }
  }
};
