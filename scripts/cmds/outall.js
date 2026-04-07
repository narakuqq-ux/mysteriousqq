module.exports = {
  config: {
    name: "outall",
    version: "2.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 2,
    description: { en: "Leave all groups except the current one" },
    category: "owner",
    guide: { en: "{pn} — bot leaves all GCs except current" }
  },

  onStart: async function ({ api, event }) {
    const { threadID } = event;
    api.getThreadList(100, null, ["INBOX"], (err, list) => {
      if (err) return api.sendMessage("May error sa pagkuha ng thread list.", threadID);
      list.forEach(item => {
        if (item.isGroup && item.threadID != threadID) {
          api.removeUserFromGroup(api.getCurrentUserID(), item.threadID);
        }
      });
      api.sendMessage("Okay na boss Sieg, nakaalis na'ko sa lahat ng GC.", threadID);
    });
  }
};
