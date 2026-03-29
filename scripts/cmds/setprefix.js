module.exports = {
  config: {
    name: "setprefix",
    version: "1.0.3",
    author: "Siegfried Samá",
    countDown: 5,
    role: 1,
    description: { en: "Change or reset the group prefix" },
    category: "admin",
    guide: { en: "{pn} <new prefix> — set new prefix\n{pn} reset — reset to default prefix" }
  },

  onStart: async function ({ event, args, message, threadsData }) {
    const { threadID } = event;

    if (!args[0]) {
      const current = global.utils.getPrefix(threadID);
      return message.reply(`kasalukuyang prefix: ${current}\n\npaano gamitin:\nsetprefix <bagong prefix>\nsetprefix reset`);
    }

    const input = args[0].trim();

    try {
      if (input.toLowerCase() === "reset") {
        await threadsData.set(threadID, null, "data.prefix");
        return message.reply(`✅ prefix na-reset sa default: ${global.GoatBot.config.prefix}`);
      }

      if (input.length > 5) return message.reply("ang haba ng prefix! max 5 characters lang.");

      await threadsData.set(threadID, input, "data.prefix");
      return message.reply(`✅ prefix na-change na sa: ${input}`);

    } catch (err) {
      console.error("[setprefix] error:", err);
      return message.reply("may error sa pag-change ng prefix, subukan ulit.");
    }
  }
};
