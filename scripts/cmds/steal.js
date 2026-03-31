module.exports = {
  config: {
    name: "steal",
    version: "1.0.0",
    author: "Mirai Team - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Steal money from a random user" },
    category: "economy",
    usages: ""
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    const allUsers = await usersData.getAll();
    const allUserIDs = allUsers.map(u => u.userID);
    const victim = allUserIDs[Math.floor(Math.random() * allUserIDs.length)];
    const nameVictim = await usersData.getName(victim);

    if (victim == api.getCurrentUserID() || senderID == victim)
      return api.sendMessage("Sorry, you cannot steal from this person. Please try again.", threadID, messageID);

    const route = Math.floor(Math.random() * 2);

    if (route > 1 || route == 0) {
      const moneydb = (await usersData.get(victim)).money || 0;
      const money = Math.floor(Math.random() * 1000) + 1;
      if (moneydb <= 0)
        return api.sendMessage(`You just stole ${nameVictim} is a poor person. So you have nothing`, threadID, messageID);
      else if (moneydb >= money)
        return api.sendMessage(`You just stole ${money}$ from ${nameVictim} in this group`, threadID, async () => {
          await usersData.addMoney(victim, -money);
          await usersData.addMoney(senderID, money);
        }, messageID);
      else
        return api.sendMessage(`You just stole it all ${moneydb}$ balance of ${nameVictim} in this group`, threadID, async () => {
          await usersData.addMoney(victim, -moneydb);
          await usersData.addMoney(senderID, moneydb);
        }, messageID);
    }
    else if (route == 1) {
      const name = await usersData.getName(senderID);
      const moneyuser = (await usersData.get(senderID)).money || 0;
      if (moneyuser <= 0)
        return api.sendMessage("You don't have money, WORK TO GET SOME MONEY..", threadID, messageID);
      else
        return api.sendMessage(`You have been captured and lost ${moneyuser}$.`, threadID, () =>
          api.sendMessage({
            body: `Congratulations ${nameVictim}! You caught ${name} and got ${Math.floor(moneyuser / 2)}$ as a reward!`,
            mentions: [{ tag: nameVictim, id: victim }, { tag: name, id: senderID }]
          }, threadID, async () => {
            await usersData.addMoney(senderID, -moneyuser);
            await usersData.addMoney(victim, Math.floor(moneyuser / 2));
          }), messageID);
    }
  }
};
