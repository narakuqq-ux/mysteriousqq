const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const GIF_URL = "https://i.imgur.com/q1INBRG.gif";

module.exports = {
  config: {
    name: "leave",
    version: "3.1.0",
    author: "Siegfried Samá",
    category: "events"
  },

  onStart: async function ({ threadsData, event, api, usersData }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    return async function () {
      const { threadID } = event;

      try {
        const threadData = await threadsData.get(threadID);

        if (threadData.settings && threadData.settings.sendLeaveMessage === false) return;

        const { leftParticipantFbId } = event.logMessageData;
        if (leftParticipantFbId == api.getCurrentUserID()) return;

        const userName = await usersData.getName(leftParticipantFbId);
        const leaveMsg = `FH SAYO ${userName}, BOBO KA. WALA KA NA NGANG AMBAG SA GC NA'TO, NAG-LEAVE KAPANG TABABOY KA 🥷🏿☄️`;

        const cacheDir = path.join(__dirname, "../cmds/cache");
        const gifPath = path.join(cacheDir, `leave_${threadID}.gif`);

        try {
          await fs.ensureDir(cacheDir);
          const res = await axios.get(GIF_URL, { responseType: "arraybuffer", timeout: 8000 });
          await fs.writeFile(gifPath, res.data);

          await api.sendMessage(
            { body: leaveMsg, attachment: fs.createReadStream(gifPath) },
            threadID,
            () => fs.unlink(gifPath).catch(() => {})
          );
        } catch (gifErr) {
          console.warn("[leave] GIF failed, sending text only:", gifErr.message);
          await api.sendMessage({ body: leaveMsg }, threadID);
        }

      } catch (err) {
        console.error("[leave] Error:", err.message);
      }
    };
  }
};
