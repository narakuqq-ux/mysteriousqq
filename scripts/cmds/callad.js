function sendToAdmin(api, adminID, msg) {
  return new Promise((resolve) => {
    api.sendMessage(msg, adminID, (err, info) => {
      if (err) return resolve({ err, info: null });
      resolve({ err: null, info });
    });
  });
}

module.exports = {
  config: {
    name: "callad",
    version: "1.0.1",
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

    const reportBody = `👤Report from: ${name}\n👨‍👩‍👧‍👧Box: ${threadName}\n🔰ID Box: ${threadID}\n🔷ID User: ${senderID}\n-----------------\n⚠️Error: ${args.join(" ")}\n-----------------\nTime: ${time}`;

    api.sendMessage(`At: ${time}\nYour report has been sent to the bot admins`, threadID, async () => {
      const admins = global.GoatBot.config.adminBot || [];
      for (const adminID of admins) {
        if (adminID == senderID) continue;
        const { err, info } = await sendToAdmin(api, adminID, reportBody);
        if (err) {
          api.sendMessage(
            `⚠️ Admin notification failed (DM unavailable).\n\n${reportBody}`,
            threadID
          );
        } else {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            messageID: info.messageID,
            author: senderID,
            sourceMessageID: messageID,
            sourceThreadID: threadID,
            type: "calladmin"
          });
        }
      }
    }, messageID);
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { threadID, messageID, senderID } = event;
    const name = await usersData.getName(senderID);

    if (Reply.type === "calladmin") {
      const replyBody = {
        body: `📌Feedback from admin ${name} to you:\n--------\n${event.body}\n--------\n»💬Reply to this message to continue sending reports to admin`,
        mentions: [{ tag: name, id: senderID }]
      };
      api.sendMessage(replyBody, Reply.sourceThreadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          adminID: senderID,
          type: "reply"
        });
      }, Reply.sourceMessageID);
    }
    else if (Reply.type === "reply") {
      const admins = global.GoatBot.config.adminBot || [];
      for (const adminID of admins) {
        const { err, info } = await sendToAdmin(api, adminID, {
          body: `📄Feedback from ${name}:\n${event.body}`,
          mentions: [{ id: senderID, tag: name }]
        });
        if (!err && info) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            messageID: info.messageID,
            author: senderID,
            sourceMessageID: messageID,
            sourceThreadID: threadID,
            type: "calladmin"
          });
        }
      }
    }
  }
};
