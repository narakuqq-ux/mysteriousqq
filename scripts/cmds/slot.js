const ITEMS = ["🍓", "🍒", "🍎", "🍉", "🍊", "🍑", "🍆", "🍈", "🥝", "🍅", "🍇"];
const MIN_BET = 50;

module.exports = {
  config: {
    name: "slot",
    version: "1.0.2",
    author: "Mirai Team - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Slot machine gambling" },
    category: "economy",
    guide: { en: "{pn} <amount> — bet money on the slot machine" }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const { threadID, messageID, senderID } = event;

    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) return message.reply("mag-lagay ng valid na halaga na ibebeto mo.");
    if (bet < MIN_BET) return message.reply(`minimum bet ay ${MIN_BET}$.`);

    try {
      const userData = await usersData.get(senderID);
      const money = userData.money || 0;

      if (bet > money) return message.reply(`kulang ang pera mo! mayroon ka lang ${money}$.`);

      const reels = [
        Math.floor(Math.random() * ITEMS.length),
        Math.floor(Math.random() * ITEMS.length),
        Math.floor(Math.random() * ITEMS.length)
      ];

      const [a, b, c] = reels;
      let win = false;
      let payout = bet;

      if (a === b && b === c) {
        payout = bet * 9;
        win = true;
      } else if (a === b || a === c || b === c) {
        payout = bet * 2;
        win = true;
      }

      const display = `🎰 ${ITEMS[a]} | ${ITEMS[b]} | ${ITEMS[c]} 🎰`;

      if (win) {
        await usersData.set(senderID, money + payout, "money");
        api.setMessageReaction("😮", messageID, () => {}, true);
        return message.reply(`${display}\nnanalo ka! +${payout}$`);
      } else {
        await usersData.set(senderID, money - bet, "money");
        api.setMessageReaction("😢", messageID, () => {}, true);
        return message.reply(`${display}\ntalo ka, nawala ${bet}$. better luck next time!`);
      }

    } catch (err) {
      return message.reply("may error, subukan ulit.");
    }
  }
};
