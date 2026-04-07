module.exports = {
  config: {
    name: "outall",
    version: "2.1.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 2,
    description: { en: "Leave all groups except the current one" },
    category: "owner",
    guide: { en: "{pn} — bot leaves all GCs except current" }
  },

  onStart: async function ({ api, event }) {
    const { threadID } = event;

    try {
      const threadMap = global.data && global.data.threadInfo;
      if (!threadMap || threadMap.size === 0) {
        return api.sendMessage("Walang nakitang thread data.", threadID);
      }

      let count = 0;
      for (const [tid, info] of threadMap) {
        if (info.isGroup && String(tid) !== String(threadID)) {
          try {
            await api.removeUserFromGroup(api.getCurrentUserID(), tid);
            count++;
          } catch (e) {}
        }
      }

      return api.sendMessage(
        `Okay na boss Sieg, nakaalis na'ko sa ${count} GC${count !== 1 ? "s" : ""}.`,
        threadID
      );
    } catch (err) {
      return api.sendMessage("May error: " + err.message, threadID);
    }
  }
};
