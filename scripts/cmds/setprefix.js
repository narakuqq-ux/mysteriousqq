module.exports = {
  config: {
    name: "setprefix",
    version: "1.0.2",
    author: "Siegfried Samá",
    countDown: 5,
    role: 1,
    description: { en: "Change or reset the group prefix" },
    category: "admin",
    guide: { en: "{pn} <new prefix> — set new prefix\n{pn} reset — reset to default prefix" }
  },

  onStart: async function ({ api, event, args, message, threadsData }) {
    const { threadID, messageID, senderID } = event;

    if (!args[0]) {
      const threadInfo = await threadsData.get(threadID);
      const current = threadInfo?.data?.PREFIX || global.GoatBot.config.prefix;
      return message.reply(`kasalukuyang prefix: ${current}\n\npaano gamitin:\nsetprefix <bagong prefix>\nsetprefix reset`);
    }

    const input = args[0].trim();

    try {
      if (input.toLowerCase() === "reset") {
        const defaultPrefix = global.GoatBot.config.prefix;
        const threadInfo = await threadsData.get(threadID);
        const data = threadInfo?.data || {};
        data.PREFIX = defaultPrefix;

        await threadsData.set(threadID, data, "data");
        if (global.GoatBot.threadData.has(String(threadID))) {
          global.GoatBot.threadData.get(String(threadID)).data.PREFIX = defaultPrefix;
        }

        return message.reply(`✅ prefix na-reset sa default: ${defaultPrefix}`);
      }

      if (input.length > 5) return message.reply("ang haba ng prefix! max 5 characters lang.");

      const threadInfo = await threadsData.get(threadID);
      const data = threadInfo?.data || {};
      data.PREFIX = input;

      await threadsData.set(threadID, data, "data");
      if (global.GoatBot.threadData.has(String(threadID))) {
        global.GoatBot.threadData.get(String(threadID)).data.PREFIX = input;
      }

      return message.reply(`✅ prefix na-change na sa: ${input}`);

    } catch (err) {
      return message.reply("may error sa pag-change ng prefix, subukan ulit.");
    }
  }
};
