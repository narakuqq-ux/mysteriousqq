const COOLDOWN = 20 * 60 * 1000;

const JOBS = [
  "sell lottery tickets 🎟️",
  "repair car 🔧",
  "programming 💻",
  "hack Facebook 😂",
  "chef 🍳",
  "mason 🧱",
  "fake taxi 🚕",
  "online seller 🛍️",
  "streamer 🎮",
  "housewife 🧹",
  'sell "flower" 🌸',
  "play Yasuo and carry your team ⚔️",
  "plumber 🔩",
  "security guard 💂",
  "delivery rider 🏍️"
];

module.exports = {
  config: {
    name: "work",
    version: "1.0.2",
    author: "Mirai Team - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Work to earn money!" },
    category: "economy",
    guide: { en: "{pn} — do a job and earn money" }
  },

  onStart: async function ({ api, event, message, usersData }) {
    const { threadID, messageID, senderID } = event;

    try {
      const userData = await usersData.get(senderID);
      const data = userData.data || {};
      const lastWork = data.workTime || 0;
      const remaining = COOLDOWN - (Date.now() - lastWork);

      if (remaining > 0) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return message.reply(`ka-trabaho mo lang kanina! bumalik ka after ${minutes} minuto at ${seconds} segundo.`);
      }

      const job = JOBS[Math.floor(Math.random() * JOBS.length)];
      const amount = Math.floor(Math.random() * 550) + 50;

      data.workTime = Date.now();
      await usersData.set(senderID, data, "data");

      const currentMoney = userData.money || 0;
      await usersData.set(senderID, currentMoney + amount, "money");

      return message.reply(`trabaho mo ngayon: ${job}\nkita mo: +${amount}$`);

    } catch (err) {
      return message.reply("may error, subukan ulit.");
    }
  }
};
