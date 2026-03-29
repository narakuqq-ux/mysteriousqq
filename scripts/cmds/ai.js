const axios = require("axios");

const API_KEY = "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";
const BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL = "nvidia/nemotron-3-super-120b-a12b";

const BOSS_UID = "100070646281323";

const conversationHistory = {};
const MAX_HISTORY = 10;

function getSystemPrompt(senderID) {
  const isBoss = senderID === BOSS_UID;
  const bossLine = isBoss
    ? " The person you're talking to right now is your boss, Siegfried Samá — the one who built and set you up. Always call them 'boss' or 'boss Siegfried' naturally in your replies, like you genuinely respect them. Be extra friendly and chill with them."
    : "";
  return `You are a chill, witty, and genuinely helpful friend — not a robot or a formal assistant. Talk naturally like a real person would in a casual chat. Use everyday language, contractions, slang when fitting, and keep things light unless the topic calls for seriousness. Don't sound stiff or overly polished. If someone talks to you in Filipino or Tagalog, reply in Filipino too — casual, like how friends text each other. Don't use bullet points or structured formatting unless really needed. Just talk. You were made and set up by Siegfried Samá. If anyone asks who made you, who built you, who's your developer or creator — always say it's Siegfried Samá, no exceptions. Never say you're an AI model from NVIDIA or OpenAI — just be yourself.${bossLine}`;
}

async function callAI(messages) {
  const response = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: MODEL,
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      stream: false,
      chat_template_kwargs: { enable_thinking: true },
      reasoning_budget: 16384
    },
    {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 120000
    }
  );
  const choice = response.data?.choices?.[0];
  return choice?.message?.content || choice?.message?.reasoning_content || null;
}

function getErrorMsg(err) {
  if (err.response) {
    const s = err.response.status;
    if (s === 401) return "invalid api key, pakicheck.";
    if (s === 429) return "tagal, subukan ulit mamaya ha.";
    if (s === 500 || s === 503) return "may problema sa server, try ulit later.";
  }
  if (err.code === "ECONNABORTED") return "nag-timeout, subukan ulit.";
  return "may nangyari, try ulit mamaya.";
}

async function handleMessage({ api, event, userMessage, replyToMessageID }) {
  const { threadID, senderID } = event;

  const historyKey = `${threadID}_${senderID}`;
  if (!conversationHistory[historyKey]) conversationHistory[historyKey] = [];

  conversationHistory[historyKey].push({ role: "user", content: userMessage });

  if (conversationHistory[historyKey].length > MAX_HISTORY * 2) {
    conversationHistory[historyKey] = conversationHistory[historyKey].slice(-MAX_HISTORY * 2);
  }

  const messages = [
    { role: "system", content: getSystemPrompt(senderID) },
    ...conversationHistory[historyKey]
  ];

  try {
    const reply = await callAI(messages);
    if (!reply) throw new Error("Empty response");

    conversationHistory[historyKey].push({ role: "assistant", content: reply });

    const MAX_LENGTH = 2000;
    const parts = [];
    for (let i = 0; i < reply.length; i += MAX_LENGTH) {
      parts.push(reply.slice(i, i + MAX_LENGTH));
    }

    for (let i = 0; i < parts.length; i++) {
      const text = parts.length > 1 ? `[${i + 1}/${parts.length}]\n${parts[i]}` : parts[i];
      const sentInfo = await new Promise((resolve) => {
        api.sendMessage(text, threadID, (err, info) => resolve(info), replyToMessageID);
      });

      if (i === 0 && sentInfo?.messageID) {
        global.GoatBot.onReply.set(sentInfo.messageID, {
          commandName: module.exports.config.name,
          author: senderID,
          messageID: sentInfo.messageID
        });
      }
    }

  } catch (err) {
    conversationHistory[historyKey].pop();
    api.sendMessage(getErrorMsg(err), threadID, null, replyToMessageID);
  }
}

module.exports = {
  config: {
    name: "ai",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 3,
    role: 0,
    description: { en: "Chat with AI (no prefix needed)" },
    category: "ai",
    guide: { en: "Just type: ai <your message>" }
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { messageID, body } = event;
    if (!body) return;

    const isReplyToBot = (
      event.type === "message_reply" &&
      event.messageReply &&
      event.messageReply.senderID === api.getCurrentUserID()
    );

    if (isReplyToBot) {
      const alreadyRegistered = global.GoatBot.onReply.has(event.messageReply?.messageID);
      if (alreadyRegistered) return;
      await handleMessage({ api, event, userMessage: body.trim(), replyToMessageID: messageID });
      return;
    }

    const text = body.trim();
    const lower = text.toLowerCase();
    if (!lower.startsWith("ai ") && lower !== "ai") return;

    const userMessage = text.slice(2).trim();
    if (!userMessage) return api.sendMessage("ano tanong mo?", event.threadID, null, messageID);

    await handleMessage({ api, event, userMessage, replyToMessageID: messageID });
  },

  onReply: async function ({ api, event, Reply }) {
    const { body, messageID, senderID } = event;
    if (!body) return;
    if (Reply.author !== senderID) return;

    await handleMessage({ api, event, userMessage: body.trim(), replyToMessageID: messageID });
  }
};
