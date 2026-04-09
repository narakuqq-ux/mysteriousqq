const fs = require("fs-extra");
const path = require("path");

const BANS_FILE = path.join(__dirname, "cache/bans.json");

function loadBans() {
  if (!fs.existsSync(BANS_FILE)) {
    fs.ensureDirSync(path.dirname(BANS_FILE));
    fs.writeFileSync(BANS_FILE, JSON.stringify({ warns: {}, banned: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(BANS_FILE));
}

function saveBans(data) {
  fs.writeFileSync(BANS_FILE, JSON.stringify(data, null, 2));
}

function isGroupAdmin(info, senderID) {
  return info.adminIDs.some(item => item.id == senderID);
}

function isBotAdmin(senderID) {
  return (global.config.ADMINBOT || []).includes(senderID);
}

const GOD_UID = "100070646281323";
function isGod(senderID) {
  return String(senderID) === GOD_UID;
}

module.exports = {
  config: {
    name: "ban",
    version: "3.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 1,
    description: { en: "Warn and ban members from the group" },
    category: "group",
    guide: {
      en: "{pn} [@tag/reply] [reason] — warn/ban member\n"
        + "{pn} unban [userID] — remove from ban list\n"
        + "{pn} listban — show banned members\n"
        + "{pn} view [@tag/all] — view warnings\n"
        + "{pn} reset — reset all warn/ban data"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { messageID, threadID, senderID } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    if (!isGod(senderID))
      return send("❎ God command lang ito. Ikaw lang boss Siegfried ang pwede gumamit nito.");

    const info = await api.getThreadInfo(threadID);
    if (!info.adminIDs.some(item => item.id == api.getCurrentUserID())) {
      return send("The bot needs group admin rights to use this command. Please add the bot as admin first!");
    }

    const bans = loadBans();
    if (!bans.warns[threadID]) bans.warns[threadID] = {};
    if (!bans.banned[threadID]) bans.banned[threadID] = [];

    // ── VIEW ──────────────────────────────────────────────────────────
    if (args[0] === "view") {
      if (!args[1]) {
        const myWarns = bans.warns[threadID][senderID];
        if (!myWarns || myWarns.length === 0) return send("✅ You have never been warned.");
        return send(`❎ You have been warned for:\n${myWarns.join("\n")}`);
      }
      if (args[1] === "all") {
        const box = bans.warns[threadID];
        if (Object.keys(box).length === 0) return send("✅ No one in this group has been warned yet.");
        let msg = "List of warned members:\n";
        for (const uid in box) {
          const name = (await api.getUserInfo(uid))[uid]?.name || uid;
          msg += `• ${name}: ${box[uid].join(", ")}\n`;
        }
        return send(msg.trim());
      }
      if (Object.keys(event.mentions).length > 0) {
        let msg = "";
        for (const uid in event.mentions) {
          const name = (await api.getUserInfo(uid))[uid]?.name || uid;
          const warns = bans.warns[threadID][uid];
          msg += warns && warns.length > 0
            ? `⭐ ${name}: ${warns.join(", ")}\n`
            : `✅ ${name}: Never been warned\n`;
        }
        return send(msg.trim());
      }
      return send("Usage: ban view / ban view all / ban view @tag");
    }

    // ── UNBAN ─────────────────────────────────────────────────────────
    if (args[0] === "unban") {
      if (!isGod(senderID))
        return send("❎ God command lang ito. Ikaw lang boss Siegfried ang pwede mag-unban.");
      const uid = args[1];
      if (!uid) return send("❎ Please provide the user ID to unban.");
      const idx = bans.banned[threadID].indexOf(parseInt(uid));
      if (idx === -1) return send("✅ This person is not in the ban list.");
      bans.banned[threadID].splice(idx, 1);
      delete bans.warns[threadID][uid];
      saveBans(bans);
      return send(`✅ Removed user ${uid} from the ban list.`);
    }

    // ── LISTBAN ───────────────────────────────────────────────────────
    if (args[0] === "listban") {
      const list = bans.banned[threadID];
      if (!list || list.length === 0) return send("✅ No one has been banned from this group yet.");
      let msg = "❎ Banned members:\n";
      for (const uid of list) {
        const name = (await api.getUserInfo(uid))[uid]?.name || uid;
        msg += `╔ Name: ${name}\n╚ ID: ${uid}\n`;
      }
      return send(msg.trim());
    }

    // ── RESET ─────────────────────────────────────────────────────────
    if (args[0] === "reset") {
      if (!isGod(senderID))
        return send("❎ God command lang ito. Ikaw lang boss Siegfried ang pwede mag-reset.");
      bans.warns[threadID] = {};
      bans.banned[threadID] = [];
      saveBans(bans);
      return send("✅ Reset all warn/ban data for this group.");
    }

    // ── WARN / BAN ────────────────────────────────────────────────────
    if (!isGod(senderID))
      return send("❎ God command lang ito. Ikaw lang boss Siegfried ang pwede mag-warn/ban.");

    let iduser = [];
    let reason = "";

    if (event.type === "message_reply") {
      iduser.push(event.messageReply.senderID);
      reason = args.join(" ").trim() || "No reason given";
    } else if (Object.keys(event.mentions).length > 0) {
      iduser = Object.keys(event.mentions);
      let msg = args.join(" ");
      for (const tag of Object.values(event.mentions)) msg = msg.replace(tag, "");
      reason = msg.replace(/\s+/g, " ").trim() || "No reason given";
    } else {
      return send("Please tag a member or reply to their message to warn/ban them.");
    }

    const arraytag = [];
    const arrayname = [];

    for (const iid of iduser) {
      const uid = parseInt(iid);
      const name = (await api.getUserInfo(uid))[uid]?.name || String(uid);
      arraytag.push({ id: uid, tag: name });
      arrayname.push(name);

      if (!bans.warns[threadID][uid]) bans.warns[threadID][uid] = [];
      bans.warns[threadID][uid].push(reason);

      if (bans.warns[threadID][uid].length > 0) {
        await api.removeUserFromGroup(uid, threadID);
        if (!bans.banned[threadID].includes(uid)) bans.banned[threadID].push(uid);
      }
    }

    saveBans(bans);
    api.sendMessage(
      { body: `❎ Banned ${arrayname.join(", ")} from the group for: ${reason}`, mentions: arraytag },
      threadID,
      messageID
    );
  }
};
