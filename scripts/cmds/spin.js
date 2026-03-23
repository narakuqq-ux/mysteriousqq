const { GoatWrapper } = require("fca-liane-utils");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "spin",
    aliases: ["spinwheel", "roulette"],
    version: "1.0",
    author: "Nisanxnx",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Spin and win coins",
    },
    longDescription: {
      en: "Spin the wheel by betting coins, and win or lose based on luck",
    },
    category: "game",
    guide: {
      en: "{p}spin [amount]",
    },
  },

  onStart: async function ({ message, event, args, usersData }) {
    const bet = parseInt(args[0]);

    if (!bet || bet <= 0 || isNaN(bet)) {
      return message.reply("❌ একটি বৈধ কয়েন পরিমাণ দিন!\n\n📌 ব্যবহার: spin 50");
    }

    const userData = await usersData.get(event.senderID);
    const balance = userData.money || 0;

    if (balance < bet) {
      return message.reply(`❌ আপনার কাছে পর্যাপ্ত কয়েন নেই!\n💰 আপনার ব্যালেন্স: ${balance} কয়েন`);
    }

    const outcomes = [
      { result: "🎉 ডাবল জিতেছেন!", multiplier: 2 },
      { result: "💸 বেট ফেরত পেয়েছেন!", multiplier: 1 },
      { result: "😢 সব হারিয়েছেন!", multiplier: 0 },
      { result: "🔥 ট্রিপল জিতেছেন!", multiplier: 3 },
      { result: "💀 ৫০% হারিয়েছেন!", multiplier: 0.5 },
      { result: "🍀 ১.৫ গুণ পেয়েছেন!", multiplier: 1.5 },
    ];

    const spin = outcomes[Math.floor(Math.random() * outcomes.length)];
    const wonAmount = Math.floor(bet * spin.multiplier);
    const netAmount = wonAmount - bet;

    // Update balance
    const newBalance = balance + netAmount;
    await usersData.set(event.senderID, {
      money: newBalance
    });

    message.reply(
      `🎡 স্পিনের ফলাফল: ${spin.result}\n` +
      `🔢 বেট: ${bet} কয়েন\n` +
      `💰 অর্জন: ${wonAmount} কয়েন\n` +
      `📊 নতুন ব্যালেন্স: ${newBalance} কয়েন`
    );
  }
};