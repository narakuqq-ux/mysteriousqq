module.exports = {
  config: {
    name: "rate",
    aliases: ["rating"],
    version: "1.0",
    author: "Nisanxnx",
    countDown: 5,
    role: 0,
    shortDescription: "র‌্যান্ডম রেটিং দাও",
    longDescription: "ট্যাগ করা ইউজারকে মজার রেটিং দিবে",
    category: "fun",
    guide: "{p}{n} @tag"
  },

  onStart: async function ({ event, message, usersData }) {
    let mention = Object.keys(event.mentions)[0] || event.senderID;
    const userName = await usersData.getName(mention);

    const rating = Math.floor(Math.random() * 101); // 0-100%
    const messages = [
      `${userName} আজ ${rating}% কিউট! 😍`,
      `${userName} এর স্মার্টনেস রেটিং: ${rating}% 🔥`,
      `${userName} is ${rating}% funny! 😂`,
      `${userName} এর আজকের স্টাইল রেটিং: ${rating}% ✨`
    ];

    // র‌্যান্ডম মেসেজ
    const finalMessage = messages[Math.floor(Math.random() * messages.length)];
    message.reply(finalMessage);
  }
};