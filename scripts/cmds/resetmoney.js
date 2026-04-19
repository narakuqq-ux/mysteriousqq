module.exports = {
  config: {
    name: "resetmoney",
    version: "2.0.0",
    author: "manhIT",
    countDown: 5,
    role: 3,
    description: {
      en: "Reset the money of all users globally to 0 (God only)"
    },
    category: "economy",
    guide: {
      en: "{pn} all — reset everyone's money to 0"
    }
  },

  onStart: async function ({ message, args, usersData }) {
    const sub = (args[0] || "").toLowerCase();

    if (sub !== "all")
      return message.reply("Usage:\n/resetmoney all — reset everyone's money to 0");

    const allUsers = await usersData.getAll();
    const withMoney = allUsers.filter(u => u.money && u.money > 0);

    if (withMoney.length === 0)
      return message.reply("✅ | Everyone already has $0. Nothing to reset.");

    for (const user of withMoney) {
      await usersData.set(user.userID, { money: 0 });
    }

    return message.reply(
      `✅ | Successfully reset the money of ${withMoney.length} user(s) to $0.\n\nThe leaderboard is now cleared.`
    );
  }
};
