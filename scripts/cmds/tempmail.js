const axios = require("axios");

const BASE = "https://kryptonite-api-library.onrender.com/api/tempmail";
const sessions = {};

module.exports = {
  config: {
    name: "tempmail",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Generate temporary email and check inbox" },
    category: "utility",
    guide: { en: "{pn} — generate temp email\n{pn} inbox <email> — check inbox" }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;

    if (args[0] === "inbox" || args[0] === "check") {
      const email = args[1] || sessions[senderID];
      if (!email) return message.reply("walang email. gumawa muna ng tempmail bro.");
      return await checkInbox({ api, event, message, email, replyToMessageID: messageID });
    }

    try {
      const res = await axios.get(`${BASE}/gen`, { timeout: 15000 });
      const email = res.data?.email || res.data?.data?.email || res.data;

      if (!email || typeof email !== "string") throw new Error("Invalid email response");

      sessions[senderID] = email;

      message.reply(
        `📧 Temp Email mo:\n\n${email}\n\nreply dito para i-check ang inbox, o type:\ntempmail inbox ${email}`,
        (err, info) => {
          if (info?.messageID) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: module.exports.config.name,
              author: senderID,
              email,
              messageID: info.messageID
            });
          }
        }
      );
    } catch (err) {
      const msg = err.response?.status === 503 ? "api offline ngayon, try ulit later." : "may error sa pag-generate ng email, subukan ulit.";
      return message.reply(msg);
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { senderID, messageID } = event;
    if (Reply.author !== senderID) return;

    const email = Reply.email || sessions[senderID];
    if (!email) return message.reply("walang nahanap na email session, mag-generate ulit.");

    await checkInbox({ api, event, message, email, replyToMessageID: messageID });
  }
};

async function checkInbox({ api, event, message, email, replyToMessageID }) {
  const { threadID, senderID } = event;
  try {
    const res = await axios.get(`${BASE}/inbox?email=${encodeURIComponent(email)}`, { timeout: 15000 });
    const inbox = res.data?.emails || res.data?.messages || res.data?.inbox || res.data;

    if (!inbox || (Array.isArray(inbox) && inbox.length === 0)) {
      return new Promise((resolve) => {
        api.sendMessage(
          `📭 Walang mensahe pa sa:\n${email}\n\nreply ulit para i-refresh.`,
          threadID,
          (err, info) => {
            if (info?.messageID) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: module.exports.config.name,
                author: senderID,
                email,
                messageID: info.messageID
              });
            }
            resolve();
          },
          replyToMessageID
        );
      });
    }

    const mails = Array.isArray(inbox) ? inbox : [inbox];
    let text = `📬 Inbox ng ${email}:\n${"─".repeat(30)}\n`;

    mails.slice(0, 5).forEach((mail, i) => {
      const from = mail.from || mail.sender || "Unknown";
      const subject = mail.subject || mail.title || "(no subject)";
      const body = mail.body || mail.content || mail.text || mail.message || "";
      const preview = body.length > 300 ? body.slice(0, 300) + "..." : body;
      text += `\n[${i + 1}] From: ${from}\nSubject: ${subject}\n${preview}\n${"─".repeat(30)}\n`;
    });

    return new Promise((resolve) => {
      api.sendMessage(text, threadID, (err, info) => {
        if (info?.messageID) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            author: senderID,
            email,
            messageID: info.messageID
          });
        }
        resolve();
      }, replyToMessageID);
    });

  } catch (err) {
    const msg = err.response?.status === 503 ? "api offline ngayon, try ulit later." : "may error sa pag-check ng inbox, subukan ulit.";
    return message.reply(msg);
  }
}
