const fs = require("fs-extra");
const path = require("path");

const GOD_UIDS = ["100070646281323"];
const FRIENDS_PATH = path.join(__dirname, "..", "..", "database", "data", "friends.json");

function loadFriends() {
  try {
    if (!fs.existsSync(FRIENDS_PATH)) return {};
    const raw = fs.readFileSync(FRIENDS_PATH, "utf8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    console.error("[friend] load error:", e.message);
    return {};
  }
}

function saveFriends(data) {
  try {
    fs.ensureDirSync(path.dirname(FRIENDS_PATH));
    fs.writeFileSync(FRIENDS_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[friend] save error:", e.message);
    return false;
  }
}

module.exports = {
  config: {
    name: "friend",
    aliases: ["friends", "kilala"],
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 3,
    role: 3,
    description: { en: "Manage AI's knowledge about your friends (God-only)" },
    category: "owner",
    guide: {
      en:
        "{pn} list — show all known friends\n" +
        "{pn} add <name> | <description> — add or update a friend\n" +
        "{pn} remove <name> — remove a friend\n" +
        "{pn} get <name> — show one friend's info\n\n" +
        "Example:\n" +
        "{pn} add edward | aso ni Siegfried, sa kanya lang lumuluhod"
    }
  },

  onStart: async function ({ message, args, event }) {
    if (!GOD_UIDS.includes(String(event.senderID))) {
      return message.reply("❎ God command lang ito boss. Ikaw lang Siegfried Samá ang pwede gumamit nito.");
    }

    const sub = (args[0] || "").toLowerCase();
    const friends = loadFriends();

    if (!sub || sub === "list" || sub === "all") {
      const keys = Object.keys(friends);
      if (keys.length === 0) return message.reply("Wala pang naka-save na kaibigan boss.");
      let out = `📒 KILALA NG AI (${keys.length}):\n\n`;
      keys.sort().forEach((k, i) => {
        out += `${i + 1}. ${k} → ${friends[k]}\n`;
      });
      return message.reply(out);
    }

    if (sub === "get" || sub === "show") {
      const name = args.slice(1).join(" ").trim().toLowerCase();
      if (!name) return message.reply("Format: friend get <name>");
      if (!friends[name]) return message.reply(`Hindi kilala ng AI si "${name}" boss.`);
      return message.reply(`👤 ${name} → ${friends[name]}`);
    }

    if (sub === "add" || sub === "set" || sub === "edit") {
      const rest = args.slice(1).join(" ").trim();
      if (!rest.includes("|")) {
        return message.reply("Format: friend add <name> | <description>\nHal: friend add edward | aso ni boss Sieg");
      }
      const [rawName, ...descParts] = rest.split("|");
      const name = rawName.trim().toLowerCase();
      const desc = descParts.join("|").trim();
      if (!name || !desc) {
        return message.reply("Kulang sa name o description boss. Format: friend add <name> | <description>");
      }
      const existed = !!friends[name];
      friends[name] = desc;
      if (!saveFriends(friends)) return message.reply("❌ Hindi nai-save boss, may file error.");
      return message.reply(`✅ ${existed ? "Na-update" : "Naidagdag"} si ${name}.\n→ ${desc}\n\nKilala na siya ng AI ngayon.`);
    }

    if (sub === "remove" || sub === "delete" || sub === "del" || sub === "rm") {
      const name = args.slice(1).join(" ").trim().toLowerCase();
      if (!name) return message.reply("Format: friend remove <name>");
      if (!friends[name]) return message.reply(`Wala namang nakalistang "${name}" boss.`);
      delete friends[name];
      if (!saveFriends(friends)) return message.reply("❌ Hindi nai-save boss.");
      return message.reply(`🗑️ Tinanggal na si ${name} sa knowledge ng AI.`);
    }

    return message.reply(
      "Subcommands:\n" +
      "• friend list\n" +
      "• friend add <name> | <description>\n" +
      "• friend remove <name>\n" +
      "• friend get <name>"
    );
  }
};
