const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const GIF_URL = "https://i.imgur.com/q1INBRG.gif";
const LOCAL_GIF = path.join(__dirname, "../cmds/cache/leave_static.gif");

async function getLeaveGif() {
  try {
    if (await fs.pathExists(LOCAL_GIF)) {
      return LOCAL_GIF;
    }
    await fs.ensureDir(path.dirname(LOCAL_GIF));
    const res = await axios.get(GIF_URL, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    await fs.writeFile(LOCAL_GIF, res.data);
    return LOCAL_GIF;
  } catch (e) {
    return null;
  }
}

module.exports = {
  config: {
    name: "leave",
    version: "3.2.0",
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

        const gifPath = await getLeaveGif();

        if (gifPath) {
          try {
            await api.sendMessage(
              { body: leaveMsg, attachment: fs.createReadStream(gifPath) },
              threadID
            );
          } catch (sendErr) {
            console.warn("[leave] Send with GIF failed:", sendErr.message);
            await api.sendMessage({ body: leaveMsg }, threadID);
          }
        } else {
          await api.sendMessage({ body: leaveMsg }, threadID);
        }

      } catch (err) {
        console.error("[leave] Error:", err.message);
      }
    };
  }
};
