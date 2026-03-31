const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "sendnoti",
    version: "1.0.2",
    author: "Mirai - Convert by Siegfried Samá",
    countDown: 5,
    role: 2,
    description: { en: "Send announcement to all threads" },
    category: "admin",
    usages: "[Text]"
  },

  langs: {
    en: {
      sendSuccess: "Sent message to %1 thread(s)!",
      sendFail: "[!] Can't send message to %1 thread(s)"
    },
    vi: {
      sendSuccess: "Đã gửi tới %1 nhóm",
      sendFail: "Không thể gửi tới %1 nhóm"
    }
  },

  onStart: async function ({ api, event, args, getLang, usersData, threadsData }) {
    const { threadID, messageID, senderID } = event;
    const name = await usersData.getName(senderID);

    const allThreads = await threadsData.getAll();
    let count = 0;
    const cantSend = [];

    if (event.type === "message_reply") {
      const reply = event.messageReply;
      if (!reply || !reply.attachments || !reply.attachments[0]) {
        return api.sendMessage("No attachment found in the replied message.", threadID, messageID);
      }
      const attachUrl = reply.attachments[0].url;
      const urlObj = new URL(attachUrl);
      const ext = urlObj.pathname.split(".").pop() || "jpg";
      const cacheDir = path.resolve(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const filePath = path.join(cacheDir, `snoti.${ext}`);
      const fileData = (await axios.get(attachUrl, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(filePath, Buffer.from(fileData));

      for (const thread of allThreads) {
        const idThread = thread.threadID;
        if (idThread == threadID) continue;
        api.sendMessage(
          { body: `${args.join(" ")}\n\nfrom Admin: ${name}`, attachment: fs.createReadStream(filePath) },
          idThread,
          (error) => { if (error) cantSend.push(idThread); }
        );
        count++;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    else {
      if (!args[0]) return api.sendMessage("Please enter the message content to announce.", threadID, messageID);
      for (const thread of allThreads) {
        const idThread = thread.threadID;
        if (idThread == threadID) continue;
        api.sendMessage(
          `${args.join(" ")}\n\nfrom Admin: ${name}`,
          idThread,
          (error) => { if (error) cantSend.push(idThread); }
        );
        count++;
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return api.sendMessage(
      getLang("sendSuccess", count),
      threadID,
      () => {
        if (cantSend.length > 0)
          api.sendMessage(getLang("sendFail", cantSend.length), threadID, messageID);
      },
      messageID
    );
  }
};
