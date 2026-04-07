module.exports = {
  config: {
    name: "outall",
    version: "2.2.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 2,
    description: { en: "Leave all groups except the current one" },
    category: "owner",
    guide: { en: "{pn} — bot leaves all GCs except current" }
  },

  onStart: async function ({ api, event, threadsData }) {
    const { threadID } = event;

    try {
      const botID = api.getCurrentUserID();
      const allThreads = await threadsData.getAll();
      const groups = allThreads.filter(t =>
        t.isGroup &&
        String(t.threadID) !== String(threadID) &&
        t.members.find(m => m.userID == botID)?.inGroup
      );

      if (groups.length === 0) {
        return api.sendMessage("Wala na akong ibang GC na lalabasin boss Sieg.", threadID);
      }

      let count = 0;
      for (const thread of groups) {
        try {
          await api.removeUserFromGroup(botID, thread.threadID);
          count++;
        } catch (e) {}
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
