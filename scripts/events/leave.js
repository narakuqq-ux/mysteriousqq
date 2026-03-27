const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { getTime } = global.utils;

const gifs = [
  "https://i.postimg.cc/zXm63C7W/sad-wave-crying.gif",
  "https://i.postimg.cc/q7mW7WDM/89fa2fcbc20ec4c71ecd3c63141ef4ff.gif"
];

module.exports = {
  config: {
    name: "leave",
    version: "3.0.0",
    author: "Siegfried Samá",
    category: "events"
  },

  langs: {
    en: {
      leaveType1: "left",
      leaveType2: "was kicked from",
      defaultLeaveMessage: "Goodbye {userName}! 👋\nYou {type} the group {threadName}. We'll miss you! 😢"
    }
  },

  onStart: async function ({ threadsData, event, api, usersData, getLang }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    return async function () {
      const { threadID } = event;

      try {
        const threadData = await threadsData.get(threadID);

        if (threadData.settings && threadData.settings.sendLeaveMessage === false) return;

        const { leftParticipantFbId } = event.logMessageData;
        if (leftParticipantFbId == api.getCurrentUserID()) return;

        const threadName = threadData.threadName || "the group";
        const userName = await usersData.getName(leftParticipantFbId);
        const hours = getTime("HH");

        const leaveType = leftParticipantFbId == event.author
          ? getLang("leaveType1")
          : getLang("leaveType2");

        let leaveMsg = (threadData.data?.leaveMessage || getLang("defaultLeaveMessage"))
          .replace(/\{userName\}|\{userNameTag\}/g, userName)
          .replace(/\{type\}/g, leaveType)
          .replace(/\{threadName\}|\{boxName\}/g, threadName)
          .replace(/\{time\}/g, hours);

        const mentions = leaveMsg.includes("{userNameTag}")
          ? [{ id: leftParticipantFbId, tag: userName }]
          : null;

        // Try sending with random GIF
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
        const cacheDir = path.join(__dirname, "../cmds/cache");
        const gifPath = path.join(cacheDir, `leave_${threadID}.gif`);

        try {
          await fs.ensureDir(cacheDir);
          const res = await axios.get(encodeURI(randomGif), {
            responseType: "arraybuffer",
            timeout: 8000
          });
          await fs.writeFile(gifPath, res.data);

          const msgObj = { body: leaveMsg, attachment: fs.createReadStream(gifPath) };
          if (mentions) msgObj.mentions = mentions;

          await api.sendMessage(
            msgObj,
            threadID,
            () => fs.unlink(gifPath).catch(() => {})
          );
        } catch (gifErr) {
          console.warn("[leave] GIF failed, sending text only:", gifErr.message);
          await api.sendMessage({ body: leaveMsg, ...(mentions ? { mentions } : {}) }, threadID);
        }

      } catch (err) {
        console.error("[leave] Error:", err.message);
      }
    };
  }
};
