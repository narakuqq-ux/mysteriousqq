const GOD_UID = "100070646281323";

const LIKE_STICKER_IDS = [
  "369239263222822",
  "369239343222814",
  "369239383222814"
];

const KICK_MSGS = [
  "🦶 [{name}] LIKA DITO! May bayad ang like zone dito — KICKED! Huwag ka nang bumalik kapag di mo alam ang rules. 😹",
  "💀 [{name}] AMBOT NIMO! Naglikezone ka? Sa GC na ito? KICKED KA! Sana matutunan mo mag-isip next time. 🤡",
  "🔫 [{name}] OY TANGA! Hindi ito pwesto ng likezone, ito ay pwesto ng may utak. ALIS NA! 😂",
  "😤 [{name}] LIKEZONE? DITO? Sa GC na ito? May kasalanan ka na. KICK NA! Alis na bes. 🥊",
  "🚪 [{name}] TANGINA MO! Naglikezone ka pa — BYE BYE! Huwag kang bumalik ng walang utak. 😈",
  "🤣 [{name}] Nag-like ka? Sige ENJOY MO YUNG PINTO! KICKED! Mag-practice ka munang mag-type. 😂",
  "💥 [{name}] GAGO KA BA? Likezone dito? LABAS NA! Bot na mismo nag-kick sayo kasi bobo ka. 🤪"
];

const enabledThreads = new Map();

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isLikeZoneSticker(event) {
  if (!event.attachments || event.attachments.length === 0) return false;
  const att = event.attachments[0];
  if (att.type !== "sticker") return false;
  const sid = String(att.stickerID || att.ID || att.id || "");
  return LIKE_STICKER_IDS.includes(sid);
}

module.exports = {
  config: {
    name: "antilz",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    shortDescription: "Auto-kick sa likezone",
    longDescription: "Kapag naka-on, awtomatikong kini-kick ang sinumang naglikezone sa GC. Admin-only ang toggle.",
    category: "group tools",
    guide: {
      en: "{pn} on — i-activate ang antilz sa GC na ito\n{pn} off — i-deactivate\n{pn} status — tingnan kung naka-on o off"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const { senderID, threadID } = event;
    const senderStr = String(senderID);
    const botAdmins = (global.config.ADMINBOT || []).map(String);
    const isAdmin = botAdmins.includes(senderStr) || senderStr === GOD_UID;

    const sub = (args[0] || "").toLowerCase();

    if (sub === "on") {
      if (!isAdmin) return message.reply("❌ Bot admins lang ang pwedeng mag-on ng antilz.");
      enabledThreads.set(threadID, true);
      return message.reply("✅ ANTILZ ON!\nMula ngayon, sinumang maglikezone sa GC na ito ay awtomatikong makiki-kick. Ingat kayo mga tanga! 😤");
    }

    if (sub === "off") {
      if (!isAdmin) return message.reply("❌ Bot admins lang ang pwedeng mag-off ng antilz.");
      enabledThreads.set(threadID, false);
      return message.reply("🔕 ANTILZ OFF.\nPahinga muna ang auto-kick. Pwede na kayong maglikezone... sa ngayon. 😒");
    }

    if (sub === "status") {
      const state = enabledThreads.get(threadID) ? "🟢 ON" : "🔴 OFF";
      return message.reply(`📊 ANTILZ STATUS: ${state}\n\nGamitin ang:\n• antilz on — i-activate\n• antilz off — i-deactivate`);
    }

    return message.reply(
      "📖 ANTILZ — Auto-Kick sa Likezone\n\n" +
      "• antilz on — i-activate (bot admin only)\n" +
      "• antilz off — i-deactivate (bot admin only)\n" +
      "• antilz status — tingnan ang status"
    );
  },

  onChat: async function ({ api, event, usersData }) {
    const { senderID, threadID } = event;
    if (!enabledThreads.get(threadID)) return;
    if (!isLikeZoneSticker(event)) return;

    const botID = String(api.getCurrentUserID());
    const senderStr = String(senderID);
    if (senderStr === botID) return;

    const botAdmins = (global.config.ADMINBOT || []).map(String);
    if (botAdmins.includes(senderStr) || senderStr === GOD_UID) return;

    try {
      const threadInfo = await new Promise((resolve, reject) =>
        api.getThreadInfo(threadID, (err, data) => err ? reject(err) : resolve(data))
      );

      const botIsAdmin = (threadInfo.adminIDs || []).map(a => String(a.id || a)).includes(botID);
      if (!botIsAdmin) return;

      const gcAdmins = (threadInfo.adminIDs || []).map(a => String(a.id || a));
      if (gcAdmins.includes(senderStr)) return;

      const name = await usersData.getName(senderID).catch(() => "User");
      const rawMsg = getRandom(KICK_MSGS).replace(/\[{name}\]/g, name);

      const mentions = [];
      let idx = 0;
      while ((idx = rawMsg.indexOf(name, idx)) !== -1) {
        mentions.push({ tag: name, id: senderID, fromIndex: idx });
        idx += name.length;
      }

      await new Promise(resolve => api.sendMessage({ body: rawMsg, mentions }, threadID, resolve));
      await new Promise(resolve => setTimeout(resolve, 1000));
      await new Promise(resolve => api.removeUserFromGroup(senderID, threadID, resolve));
    } catch (err) {
      console.error("[antilz] Error:", err.message);
    }
  }
};
