const axios = require("axios");

const BASE = "https://kryptonite-api-library.onrender.com/api/tempmail";
const sessions = {};

module.exports = {
  config: {
    name: "temp",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Temporary email generator and inbox checker" },
    category: "utility",
    guide: { en: "{pn} gen — generate a temp email\n{pn} inbox <email> — check inbox for codes" }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;
    const sub = (args[0] || "gen").toLowerCase();

    if (sub === "gen") {
      try {
        const res = await axios.get(`${BASE}/gen`, { timeout: 15000 });
        const email =
          res.data?.email ||
          res.data?.data?.email ||
          (typeof res.data === "string" ? res.data : null);

        if (!email) throw new Error("no email in response");

        sessions[senderID] = email;

        message.reply(
          `📧 Temp email mo:\n\n${email}\n\nreply dito para i-check ang inbox, o:\ntemp inbox ${email}`,
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
      } catch (err) {
        const msg =
          err.response?.status === 503
            ? "api offline ngayon, try ulit later."
            : "may error sa pag-generate ng email, subukan ulit.";
        return message.reply(msg);
      }
      return;
    }

    if (sub === "inbox") {
      const email = args[1] || sessions[senderID];
      if (!email) return message.reply("walang email. mag-gen muna: temp gen");
      return await checkInbox({ api, event, message, email, replyToMessageID: messageID, senderID });
    }

    return message.reply(
      "hindi kilalang subcommand.\n\ntemp gen — para gumawa ng email\ntemp inbox <email> — para i-check ang inbox"
    );
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { senderID, messageID } = event;
    if (Reply.author !== senderID) return;

    const email = Reply.email || sessions[senderID];
    if (!email) return message.reply("walang nahanap na email session, mag-gen ulit: temp gen");

    await checkInbox({ api, event, message, email, replyToMessageID: messageID, senderID });
  }
};

async function checkInbox({ api, event, message, email, replyToMessageID, senderID }) {
  const { threadID } = event;
  try {
    const res = await axios.get(`${BASE}/inbox?email=${encodeURIComponent(email)}`, { timeout: 15000 });
    const inbox =
      res.data?.emails ||
      res.data?.messages ||
      res.data?.inbox ||
      res.data;

    if (!inbox || (Array.isArray(inbox) && inbox.length === 0)) {
      return new Promise((resolve) => {
        api.sendMessage(
          `📭 Wala pang mensahe sa:\n${email}\n\nreply ulit para i-refresh ang inbox.`,
          threadID,
          (err, info) => {
            if (info?.messageID) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "temp",
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
    let text = `📬 Inbox ng ${email}:\n${"─".repeat(28)}\n`;

    mails.slice(0, 5).forEach((mail, i) => {
      const from = mail.from || mail.sender || "Unknown";
      const subject = mail.subject || mail.title || "(no subject)";
      const body = mail.body || mail.content || mail.text || mail.message || "";
      const preview = body.length > 300 ? body.slice(0, 300) + "..." : body;
      text += `\n[${i + 1}] From: ${from}\nSubject: ${subject}\n${preview}\n${"─".repeat(28)}\n`;
    });

    return new Promise((resolve) => {
      api.sendMessage(
        text,
        threadID,
        (err, info) => {
          if (info?.messageID) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "temp",
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
  } catch (err) {
    const msg =
      err.response?.status === 503
        ? "api offline ngayon, try ulit later."
        : "may error sa pag-check ng inbox, subukan ulit.";
    return message.reply(msg);
  }
}
