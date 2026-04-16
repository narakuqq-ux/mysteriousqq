const axios = require("axios");

const DOMAIN = "@timpmeyl.indevs.in";
const INBOX_API = "https://temporary-emaill.netlify.app/api/messages";

const sessions = {};

function generateRandomEmail() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let username = "";
  for (let i = 0; i < 8; i++) username += chars[Math.floor(Math.random() * chars.length)];
  return username + DOMAIN;
}

function generateCustomEmail(name) {
  const username = name.trim().toLowerCase().split("@")[0].replace(/[^a-z0-9]/g, "");
  return (username || generateRandomEmail().split("@")[0]) + DOMAIN;
}

function extractOTP(messages) {
  for (const msg of messages) {
    const subject = msg.subject || msg.title || "";
    const body = (msg.body || msg.content || msg.text || "").replace(/<[^>]*>/g, "");
    const combined = subject + " " + body;
    const match = combined.match(/\b\d{5,8}\b/);
    if (match) return match[0];
  }
  return null;
}

async function checkInbox({ api, event, message, email, replyToMessageID, senderID }) {
  const { threadID } = event;
  try {
    const res = await axios.get(INBOX_API, {
      params: { address: email, nocache: Date.now() },
      timeout: 15000
    });

    const data = res.data;
    const inbox =
      (Array.isArray(data) ? data : null) ||
      (Array.isArray(data?.messages) ? data.messages : null) ||
      (Array.isArray(data?.emails) ? data.emails : null) ||
      [];

    const registerReply = (msgID) => {
      if (msgID) {
        global.GoatBot.onReply.set(msgID, {
          commandName: "temp",
          author: senderID,
          email,
          messageID: msgID
        });
      }
    };

    if (inbox.length === 0) {
      return new Promise((resolve) => {
        api.sendMessage(
          `📭 No messages yet in:\n${email}\n\nReply to this message to refresh.`,
          threadID,
          (err, info) => { registerReply(info?.messageID); resolve(); },
          replyToMessageID
        );
      });
    }

    const otp = extractOTP(inbox);
    let text = `📬 Inbox for:\n${email}\n${"─".repeat(30)}\n`;
    if (otp) text += `\n🔑 OTP/Code detected: ${otp}\n${"─".repeat(30)}\n`;

    inbox.slice(0, 5).forEach((mail, i) => {
      const from = mail.from || mail.sender || mail.from_address || "Unknown";
      const subject = mail.subject || mail.title || "(no subject)";
      const body = (mail.body || mail.content || mail.text || mail.html || "").replace(/<[^>]*>/g, "").trim();
      const preview = body.length > 350 ? body.slice(0, 350) + "..." : (body || "(no content)");
      text += `\n[${i + 1}] From: ${from}\nSubject: ${subject}\n${preview}\n${"─".repeat(30)}\n`;
    });

    return new Promise((resolve) => {
      api.sendMessage(
        text,
        threadID,
        (err, info) => { registerReply(info?.messageID); resolve(); },
        replyToMessageID
      );
    });

  } catch (err) {
    return message.reply("❌ Error checking inbox. Please try again later.");
  }
}

module.exports = {
  config: {
    name: "temp",
    version: "2.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Temporary email generator and inbox checker" },
    category: "utility",
    guide: {
      en: "{pn} gen — generate a random temp email\n{pn} gen <name> — generate custom email (e.g. temp gen siegfried)\n{pn} inbox — check your inbox"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;
    const sub = (args[0] || "gen").toLowerCase();

    if (sub === "gen") {
      const customName = args[1] || null;
      const email = customName ? generateCustomEmail(customName) : generateRandomEmail();
      sessions[senderID] = { email };

      return message.reply(
        `📧 Your temporary email:\n\n${email}\n\nDomain: timpmeyl.indevs.in\n\nReply to this message to check your inbox, or type:\ntemp inbox`,
        (err, info) => {
          if (info?.messageID) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "temp",
              author: senderID,
              email,
              messageID: info.messageID
            });
          }
        }
      );
    }

    if (sub === "inbox") {
      const session = sessions[senderID];
      const email = args[1] || session?.email;
      if (!email) return message.reply("❌ No email found. Generate one first:\ntemp gen");
      return await checkInbox({ api, event, message, email, replyToMessageID: messageID, senderID });
    }

    return message.reply(
      "📖 TEMP MAIL\n\n" +
      "temp gen — random email\n" +
      "temp gen <name> — custom email\n" +
      "temp inbox — check inbox"
    );
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { senderID, messageID } = event;
    if (Reply.author !== senderID) return;

    const email = Reply.email || sessions[senderID]?.email;
    if (!email) return message.reply("❌ No email session found. Generate a new one: temp gen");

    await checkInbox({ api, event, message, email, replyToMessageID: messageID, senderID });
  }
};
