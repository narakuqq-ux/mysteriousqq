const axios = require("axios");

const BASE_GEN = "https://www.smfahim.xyz/tempmail/v1";
const BASE_INBOX = "https://www.smfahim.xyz/tempmail/v1/inbox";
const sessions = {};

module.exports = {
  config: {
    name: "temp",
    version: "1.2.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Temporary email generator and inbox checker" },
    category: "utility",
    guide: { en: "{pn} gen — generate a temp email\n{pn} inbox — check your inbox" }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;
    const sub = (args[0] || "gen").toLowerCase();

    if (sub === "gen") {
      try {
        const res = await axios.get(BASE_GEN, { timeout: 15000 });
        const email = res.data?.email || res.data?.data?.email || (typeof res.data === "string" ? res.data : null);
        const token = res.data?.token || res.data?.data?.token || null;

        if (!email) throw new Error("no email in response");

        sessions[senderID] = { email, token };

        message.reply(
          `📧 Your temporary email:\n\n${email}\n\nReply to this message to check your inbox, or use:\ntemp inbox`,
          (err, info) => {
            if (info?.messageID) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "temp",
                author: senderID,
                email,
                token,
                messageID: info.messageID
              });
            }
          }
        );
      } catch (err) {
        const msg =
          err.response?.status === 503
            ? "The API is currently offline. Please try again later."
            : "Error generating email. Please try again.";
        return message.reply(msg);
      }
      return;
    }

    if (sub === "inbox") {
      const session = sessions[senderID];
      const email = args[1] || session?.email;
      const token = session?.token || null;
      if (!email) return message.reply("No email found. Generate one first: temp gen");
      return await checkInbox({ api, event, message, email, token, replyToMessageID: messageID, senderID });
    }

    return message.reply(
      "Unknown subcommand.\n\ntemp gen — generate a temp email\ntemp inbox — check your inbox"
    );
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { senderID, messageID } = event;
    if (Reply.author !== senderID) return;

    const email = Reply.email || sessions[senderID]?.email;
    const token = Reply.token || sessions[senderID]?.token || null;
    if (!email) return message.reply("No email session found. Generate a new one: temp gen");

    await checkInbox({ api, event, message, email, token, replyToMessageID: messageID, senderID });
  }
};

async function checkInbox({ api, event, message, email, token, replyToMessageID, senderID }) {
  const { threadID } = event;
  try {
    const params = { email };
    if (token) params.token = token;

    const res = await axios.get(BASE_INBOX, { params, timeout: 15000 });
    const data = res.data;

    if (data?.error) {
      const detail = data.details?.message || data.error;
      const replyMsg = detail.toLowerCase().includes("not found")
        ? `📭 This email was not found or has expired:\n${email}\n\nGenerate a new one: temp gen`
        : `Inbox error: ${detail}`;
      return message.reply(replyMsg);
    }

    const inbox =
      (Array.isArray(data?.emails) ? data.emails : null) ||
      (Array.isArray(data?.messages) ? data.messages : null) ||
      (Array.isArray(data?.inbox) ? data.inbox : null) ||
      (Array.isArray(data) ? data : null);

    if (!inbox || inbox.length === 0) {
      return new Promise((resolve) => {
        api.sendMessage(
          `📭 No messages yet in:\n${email}\n\nReply to refresh your inbox.`,
          threadID,
          (err, info) => {
            if (info?.messageID) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "temp",
                author: senderID,
                email,
                token,
                messageID: info.messageID
              });
            }
            resolve();
          },
          replyToMessageID
        );
      });
    }

    let text = `📬 Inbox for ${email}:\n${"─".repeat(28)}\n`;

    inbox.slice(0, 5).forEach((mail, i) => {
      const from = mail.from || mail.sender || mail.from_address || "Unknown";
      const subject = mail.subject || mail.title || "(no subject)";
      const body = mail.body || mail.content || mail.text || mail.html || mail.message || "";
      const cleanBody = body.replace(/<[^>]*>/g, "").trim();
      const preview = cleanBody.length > 400 ? cleanBody.slice(0, 400) + "..." : cleanBody;
      text += `\n[${i + 1}] From: ${from}\nSubject: ${subject}\n${preview || "(no content)"}\n${"─".repeat(28)}\n`;
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
              token,
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
        ? "The API is currently offline. Please try again later."
        : "Error checking inbox. Please try again.";
    return message.reply(msg);
  }
}
