const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

if (!global.temp.welcomeEvent)
  global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "3.0.0",
    author: "Siegfried Samá",
    category: "events"
  },

  langs: {
    en: {
      botAdded: "%1 Connected successfully!\nThank you for choosing %1 bot, have fun using it UwU ❤",
      welcomeMessage: "BONJOUR!, {uName}\n┌────── ～●～ ──────┐\n----- Welcome to {threadName} -----\n└────── ～●～ ──────┘\nYou're the {soThanhVien}th member of this group, please enjoy! 🥳♥"
    }
  },

  onStart: async function ({ threadsData, event, api, getLang, usersData }) {
    if (event.logMessageType !== "log:subscribe") return;

    return async function () {
      const { threadID } = event;
      const { nickNameBot } = global.GoatBot.config;
      const prefix = global.utils.getPrefix(threadID);
      const dataAddedParticipants = event.logMessageData.addedParticipants;

      // ── Bot was added to a group ──
      if (dataAddedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        if (nickNameBot)
          api.changeNickname(`» ${prefix} « ${nickNameBot}`, threadID, api.getCurrentUserID());

        const { threadApproval } = global.GoatBot.config;
        if (threadApproval && threadApproval.enable) {
          const isAutoApproved = threadApproval.autoApprovedThreads &&
            threadApproval.autoApprovedThreads.includes(threadID);

          if (isAutoApproved) {
            await threadsData.set(threadID, { approved: true });
            setTimeout(async () => {
              try { await api.sendMessage(getLang("botAdded", nickNameBot), threadID); }
              catch (err) { console.error("[welcome] botAdded error:", err.message); }
            }, 2000);
          } else {
            await threadsData.set(threadID, { approved: false });
          }
          return;
        }

        setTimeout(async () => {
          try { await api.sendMessage(getLang("botAdded", nickNameBot), threadID); }
          catch (err) { console.error("[welcome] botAdded error:", err.message); }
        }, 2000);
        return;
      }

      // ── New member(s) joined ──
      if (!global.temp.welcomeEvent[threadID])
        global.temp.welcomeEvent[threadID] = { joinTimeout: null, participants: [] };

      global.temp.welcomeEvent[threadID].participants.push(...dataAddedParticipants);
      clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

      global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
        try {
          const threadData = await threadsData.get(threadID);
          if (threadData.settings && threadData.settings.sendWelcomeMessage === false) return;

          const participants = global.temp.welcomeEvent[threadID].participants;
          global.temp.welcomeEvent[threadID].participants = [];

          let threadInfo;
          try { threadInfo = await api.getThreadInfo(threadID); }
          catch (e) { threadInfo = { threadName: threadData.threadName || "this group", participantIDs: [] }; }

          const threadName = threadInfo.threadName || threadData.threadName || "this group";
          const totalMembers = threadInfo.participantIDs
            ? threadInfo.participantIDs.length
            : (threadData.members ? threadData.members.length : 0);

          const nameArray = [];
          const mentions = [];
          const memberNumbers = [];

          for (let idx = 0; idx < participants.length; idx++) {
            const p = participants[idx];
            if (p.userFbId == api.getCurrentUserID()) continue;
            const name = (p.fullName || "Member").replace("@", "");
            nameArray.push(name);
            mentions.push({ tag: name, id: p.userFbId, fromIndex: 0 });
            memberNumbers.push(totalMembers - participants.length + idx + 1);
          }

          if (nameArray.length === 0) return;

          const customMsg = threadData.data?.welcomeMessage;
          const msg = (customMsg || getLang("welcomeMessage"))
            .replace(/\{uName\}/g, nameArray.join(", "))
            .replace(/\{type\}/g, nameArray.length > 1 ? "you guys" : "Friend")
            .replace(/\{soThanhVien\}/g, memberNumbers.join(", "))
            .replace(/\{threadName\}/g, threadName)
            .replace(/\{totalMembers\}/g, totalMembers);

          // Try to send with GIF, fallback to text if it fails
          const cacheDir = path.join(__dirname, "../cmds/cache");
          const gifPath = path.join(cacheDir, `welcome_${threadID}.gif`);
          const gifUrl = "https://i.ibb.co/WN85p1C2/anime-welcome.gif";

          try {
            await fs.ensureDir(cacheDir);
            const res = await axios.get(encodeURI(gifUrl), {
              responseType: "arraybuffer",
              timeout: 8000
            });
            await fs.writeFile(gifPath, res.data);
            await api.sendMessage(
              { body: msg, attachment: fs.createReadStream(gifPath), mentions },
              threadID,
              () => fs.unlink(gifPath).catch(() => {})
            );
          } catch (gifErr) {
            console.warn("[welcome] GIF failed, sending text only:", gifErr.message);
            await api.sendMessage({ body: msg, mentions }, threadID);
          }

        } catch (err) {
          console.error("[welcome] Error:", err.message);
        }
      }, 1500);
    };
  }
};
