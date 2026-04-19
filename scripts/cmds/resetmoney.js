module.exports = {
  config: {
    name: "resetmoney",
    version: "1.0.0",
    author: "manhIT",
    countDown: 5,
    role: 1,
    description: {
      en: "Reset the money of all members in the group to 0"
    },
    category: "economy",
    guide: {
      en: "{pn} — reset all members' money to 0"
    }
  },

  onStart: async function ({ api, event, message, usersData }) {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const members = threadInfo.userInfo;

    let count = 0;
    for (const user of members) {
      const data = await usersData.get(user.id);
      if (data && typeof data.money !== "undefined") {
        await usersData.set(user.id, { money: 0 });
        count++;
      }
    }

    return message.reply(`✅ | Successfully reset the money of ${count} member(s) in this group to $0.`);
  }
};
