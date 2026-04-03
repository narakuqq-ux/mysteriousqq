const fs = require("fs");
const path = require("path");

if (!global.mediaCooldown) global.mediaCooldown = new Map();

module.exports = {
  config: {
    name: "casino2",
    aliases: [],
    version: "2.5.0",
    author: "ST | Sheikh Tamim",
    description: "Professional 3-reel casino slot machine",
    usage: "casino2 [bet]",
    category: "game",
    role: 0,
    countDown: 5
  },

  ST: async function ({ api, event, message, args, usersData }) {
    const { threadID, senderID, messageID } = event;

    const _now = Date.now();
    const _last = global.mediaCooldown.get(senderID) || 0;
    if (_now - _last < 5000) {
      return api.sendMessage("please wait 5 seconds before using this command to avoid overloaded", threadID, messageID);
    }
    global.mediaCooldown.set(senderID, _now);

    const betAmount = parseInt(args[0]) || 100;
    if (betAmount < 50 || betAmount > 50000) return message.reply("❌ Bet range: 50 - 50,000 coins");

    const userData = await usersData.get(senderID);
    const userMoney = userData.money || 0;
    if (userMoney < betAmount) return message.reply(`❌ Insufficient! Balance: ${userMoney.toLocaleString()}`);

    const symbols = [
      { emoji: "🍒", name: "Cherry", value: 3 },
      { emoji: "🍋", name: "Lemon", value: 5 },
      { emoji: "🍊", name: "Orange", value: 8 },
      { emoji: "🔔", name: "Bell", value: 15 },
      { emoji: "💎", name: "Diamond", value: 25 },
      { emoji: "⭐", name: "Star", value: 50 },
      { emoji: "7️⃣", name: "Lucky 7", value: 100 }
    ];

    const getRandomSymbol = () => symbols[Math.floor(Math.random() * symbols.length)];

    const isWin = Math.random() < 0.3;
    let finalReels, winAmount, isJackpot = false;

    if (isWin) {
      const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      finalReels = [winSymbol, winSymbol, winSymbol];
      winAmount = betAmount * winSymbol.value;
      isJackpot = winSymbol.emoji === "7️⃣";
    } else {
      finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
      while (finalReels[0].emoji === finalReels[1].emoji && finalReels[1].emoji === finalReels[2].emoji) {
        finalReels[2] = getRandomSymbol();
      }
      winAmount = -betAmount;
    }

    const newBalance = userMoney + winAmount;
    await usersData.set(senderID, { money: newBalance });

    const reelDisplay = finalReels.map(r => r.emoji).join("  |  ");
    let result;
    if (isJackpot) {
      result = `🎰 SLOT MACHINE\n━━━━━━━━━━━━━━━\n[ ${reelDisplay} ]\n━━━━━━━━━━━━━━━\n🎊 JACKPOT! +$${winAmount.toLocaleString()} coins!\n💰 Balance: $${newBalance.toLocaleString()}`;
    } else if (isWin) {
      result = `🎰 SLOT MACHINE\n━━━━━━━━━━━━━━━\n[ ${reelDisplay} ]\n━━━━━━━━━━━━━━━\n🎉 You won +$${winAmount.toLocaleString()} coins!\n💰 Balance: $${newBalance.toLocaleString()}`;
    } else {
      result = `🎰 SLOT MACHINE\n━━━━━━━━━━━━━━━\n[ ${reelDisplay} ]\n━━━━━━━━━━━━━━━\n😢 You lost $${betAmount.toLocaleString()} coins.\n💰 Balance: $${newBalance.toLocaleString()}`;
    }
    message.reply(result);
  }
};
