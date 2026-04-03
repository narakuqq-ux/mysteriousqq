const fs = require("fs");
const path = require("path");

if (!global.mediaCooldown) global.mediaCooldown = new Map();

module.exports = {
  config: {
    name: "megaspin",
    aliases: [],
    version: "2.5.0",
    author: "ST | Sheikh Tamim",
    description: "Professional 5-reel slot machine with casino-style design",
    usage: "megaspin [bet]",
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
    if (betAmount < 50) return message.reply("❌ Minimum bet is 50 coins!");
    if (betAmount > 50000) return message.reply("❌ Maximum bet is 50,000 coins!");

    const userData = await usersData.get(senderID);
    const userMoney = userData.money || 0;
    if (userMoney < betAmount) return message.reply(`❌ Insufficient balance!\n💰 Balance: ${userMoney.toLocaleString()}\n🎰 Bet: ${betAmount.toLocaleString()}`);

    const symbols = [
      { emoji: "🍒", name: "Cherry", value: 2, rarity: 0.25 },
      { emoji: "🍋", name: "Lemon", value: 3, rarity: 0.20 },
      { emoji: "🍊", name: "Orange", value: 4, rarity: 0.18 },
      { emoji: "🍇", name: "Grape", value: 5, rarity: 0.15 },
      { emoji: "🔔", name: "Bell", value: 10, rarity: 0.10 },
      { emoji: "💎", name: "Diamond", value: 20, rarity: 0.07 },
      { emoji: "⭐", name: "Star", value: 50, rarity: 0.04 },
      { emoji: "7️⃣", name: "Lucky 7", value: 100, rarity: 0.01 }
    ];

    const getRandomSymbol = () => {
      const rand = Math.random();
      let cumulative = 0;
      for (const symbol of symbols) {
        cumulative += symbol.rarity;
        if (rand <= cumulative) return symbol;
      }
      return symbols[0];
    };

    const isWin = Math.random() < 0.25;
    let finalReels = [];
    let winType = "";
    let multiplier = 0;

    if (isWin) {
      const winChance = Math.random();
      if (winChance < 0.6) {
        const winSymbol = getRandomSymbol();
        finalReels = [getRandomSymbol(), winSymbol, winSymbol, winSymbol, getRandomSymbol()];
        multiplier = winSymbol.value;
        winType = `${winSymbol.name} x3`;
      } else if (winChance < 0.9) {
        const winSymbol = getRandomSymbol();
        finalReels = [winSymbol, winSymbol, winSymbol, winSymbol, getRandomSymbol()];
        multiplier = winSymbol.value * 3;
        winType = `${winSymbol.name} x4`;
      } else {
        const winSymbol = symbols[Math.floor(Math.random() * 5) + 3];
        finalReels = [winSymbol, winSymbol, winSymbol, winSymbol, winSymbol];
        multiplier = winSymbol.value * 10;
        winType = `MEGA ${winSymbol.name} x5`;
      }
    } else {
      finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
      for (let i = 0; i < 3; i++) {
        if (finalReels[i].emoji === finalReels[i + 1].emoji && finalReels[i + 1].emoji === finalReels[i + 2].emoji) {
          finalReels[i + 2] = getRandomSymbol();
        }
      }
    }

    const winAmount = isWin ? betAmount * multiplier : -betAmount;
    const newBalance = userMoney + winAmount;
    await usersData.set(senderID, { money: newBalance });

    const reelDisplay = finalReels.map(r => r.emoji).join("  |  ");
    let result;
    if (isWin) {
      result = `🎰 MEGA SPIN\n━━━━━━━━━━━━━━━\n[ ${reelDisplay} ]\n━━━━━━━━━━━━━━━\n🎉 ${winType}! +$${(betAmount * multiplier).toLocaleString()} coins!\n💰 Balance: $${newBalance.toLocaleString()}`;
    } else {
      result = `🎰 MEGA SPIN\n━━━━━━━━━━━━━━━\n[ ${reelDisplay} ]\n━━━━━━━━━━━━━━━\n😢 No match. Lost $${betAmount.toLocaleString()} coins.\n💰 Balance: $${newBalance.toLocaleString()}`;
    }
    message.reply(result);
  }
};
