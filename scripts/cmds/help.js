module.exports = {
  config: {
    name: "help",
    version: "1.0.2",
    author: "Mirai Team (modified by Siegfried Samá)",
    countDown: 5,
    role: 0,
    description: {
      en: "Beginner's Guide"
    },
    category: "system",
    guide: {
      en: "{pn} [command name] or {pn} [page number]"
    },
    envConfig: {
      autoUnsend: false,
      delayUnsend: 20
    }
  },

  langs: {
    en: {
      moduleInfo: "「 %1 」\n%2\n\n❯ Usage: %3\n❯ Category: %4\n❯ Waiting time: %5 second(s)\n❯ Permission: %6\n\n» Module code by %7 «",
      helpList: '[ There are %1 commands on this bot. Use: "%2help [command name]" to see details! ]',
      user: "User",
      adminGroup: "Admin group",
      adminBot: "Admin bot"
    }
  },

  onChat: async function ({ api, event, getLang }) {
    const { threadID, messageID, body } = event;
    if (!body || body.toLowerCase().indexOf("help") !== 0) return;

    const splitBody = body.trim().split(/\s+/);
    if (splitBody.length < 2) return;

    const commandName = splitBody[1].toLowerCase();
    const commands = global.GoatBot.commands;
    if (!commands || !commands.has(commandName)) return;

    const command = commands.get(commandName);
    const prefix = global.GoatBot.config.prefix || "";

    const roleText = command.config.role == 2
      ? getLang("adminBot")
      : command.config.role == 1
        ? getLang("adminGroup")
        : getLang("user");

    const usages = command.config.guide
      ? (typeof command.config.guide === "string" ? command.config.guide : command.config.guide.en || "")
      : (command.config.usages || "");

    const category = command.config.category || command.config.commandCategory || "unknown";
    const cooldown = command.config.countDown !== undefined ? command.config.countDown : (command.config.cooldowns || 0);
    const author = command.config.author || command.config.credits || "Unknown";
    const desc = typeof command.config.description === "string"
      ? command.config.description
      : (command.config.description?.en || "No description");

    return api.sendMessage(
      getLang("moduleInfo",
        command.config.name,
        desc,
        `${prefix}${command.config.name} ${usages}`.trim(),
        category,
        cooldown,
        roleText,
        author
      ),
      threadID,
      messageID
    );
  },

  onStart: async function ({ api, event, args, getLang }) {
    const { threadID, messageID } = event;
    const commands = global.GoatBot.commands;
    const prefix = global.GoatBot.config.prefix || "";

    const envConf = (global.GoatBot.configCommands || {})[this.config.name]?.envConfig
      || this.config.envConfig
      || { autoUnsend: false, delayUnsend: 20 };

    const { autoUnsend, delayUnsend } = envConf;

    const commandName = (args[0] || "").toLowerCase();

    if (commandName && isNaN(commandName)) {
      const command = commands.get(commandName);

      if (!command) {
        return api.sendMessage(`❌ Command "${args[0]}" not found.`, threadID, messageID);
      }

      const roleText = command.config.role == 2
        ? getLang("adminBot")
        : command.config.role == 1
          ? getLang("adminGroup")
          : getLang("user");

      const usages = command.config.guide
        ? (typeof command.config.guide === "string" ? command.config.guide : command.config.guide.en || "")
        : (command.config.usages || "");

      const category = command.config.category || command.config.commandCategory || "unknown";
      const cooldown = command.config.countDown !== undefined ? command.config.countDown : (command.config.cooldowns || 0);
      const author = command.config.author || command.config.credits || "Unknown";
      const desc = typeof command.config.description === "string"
        ? command.config.description
        : (command.config.description?.en || "No description");

      return api.sendMessage(
        getLang("moduleInfo",
          command.config.name,
          desc,
          `${prefix}${command.config.name} ${usages}`.trim(),
          category,
          cooldown,
          roleText,
          author
        ),
        threadID,
        messageID
      );
    }

    const arrayInfo = [];
    const page = parseInt(args[0]) || 1;
    const numberOfOnePage = 20;

    let msg = ".   ˗ˏˋ ꒰ COMMAND LIST ꒱ ˎˊ˗\n\n";

    for (const [name, value] of commands) {
      const usages = value.config.guide
        ? (typeof value.config.guide === "string" ? value.config.guide : value.config.guide.en || "")
        : (value.config.usages || "");
      arrayInfo.push(`${name} » ${usages}`);
    }

    arrayInfo.sort((a, b) => a.localeCompare(b));

    const totalPages = Math.ceil(arrayInfo.length / numberOfOnePage);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startSlice = numberOfOnePage * safePage - numberOfOnePage;
    const returnArray = arrayInfo.slice(startSlice, startSlice + numberOfOnePage);

    for (const item of returnArray) msg += ` \n╰•➤ ${item}\n`;

    const text = `\n➪ Page (${safePage}/${totalPages})\n➥ Type: "${prefix}help [command]" for details\n\n➟ Number of pages: ${totalPages}`;

    return api.sendMessage(msg + text, threadID, async (error, info) => {
      if (!error && autoUnsend && info) {
        await new Promise(resolve => setTimeout(resolve, delayUnsend * 1000));
        api.unsendMessage(info.messageID).catch(() => {});
      }
    });
  }
};
