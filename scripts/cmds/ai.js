const axios = require("axios");

const API_KEY = "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";
const BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL = "nvidia/nemotron-3-super-120b-a12b";

const conversationHistory = {};
const MAX_HISTORY = 10;

const SYSTEM_PROMPT = `You are a chill, witty, and genuinely helpful friend — not a robot or a formal assistant. Talk naturally like a real person would in a casual chat. Use everyday language, contractions, slang when fitting, and keep things light unless the topic calls for seriousness. Don't sound stiff or overly polished. If someone talks to you in Filipino or Tagalog, reply in Filipino too — casual, like how friends text each other. Don't use bullet points or structured formatting unless really needed. Just talk. You were made and set up by Siegfried Samá. If anyone asks who made you, who built you, who's your developer or creator — always say it's Siegfried Samá, no exceptions. Never say you're an AI model from NVIDIA or OpenAI — just be yourself.`;

async function callAI(messages) {
  const response = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: MODEL,
      messages: messages,
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

async function sendReply(api, threadID, messageID, reply) {
  const MAX_LENGTH = 2000;
  if (reply.length <= MAX_LENGTH) {
    return new Promise((resolve) => {
      api.sendMessage(reply, threadID, resolve, messageID);
    });
  }
  const parts = [];
  for (let i = 0; i < reply.length; i += MAX_LENGTH) {
    parts.push(reply.slice(i, i + MAX_LENGTH));
  }
  for (let i = 0; i < parts.length; i++) {
    const prefix = `[${i + 1}/${parts.length}]\n`;
    await new Promise((resolve) => {
      api.sendMessage(prefix + parts[i], threadID, resolve, messageID);
    });
  }
}

function getErrorMsg(err) {
  if (err.response) {
    const status = err.response.status;
    if (status === 401) return "invalid api key bro, pakicheck.";
    if (status === 429) return "tagal, subukan ulit mamaya ha.";
    if (status === 500 || status === 503) return "may problema sa server, try ulit later.";
  }
  if (err.code === "ECONNABORTED") return "nag-timeout, subukan ulit.";
  return "may nangyari, try ulit mamaya.";
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

  onChat: async function ({ api, event, message }) {
    const { threadID, messageID, senderID, body } = event;
    if (!body) return;

    const text = body.trim();
    const lowerText = text.toLowerCase();

    const isAiTrigger = lowerText.startsWith("ai ") || lowerText === "ai";
    const isReplyToBot = (
      event.type === "message_reply" &&
      event.messageReply &&
      event.messageReply.senderID === api.getCurrentUserID()
    );

    if (!isAiTrigger && !isReplyToBot) return;

    let userMessage = isAiTrigger ? text.slice(2).trim() : text;

    if (!userMessage) {
      return message.reply("ano tanong mo?");
    }

    const historyKey = `${threadID}_${senderID}`;
    if (!conversationHistory[historyKey]) conversationHistory[historyKey] = [];

    conversationHistory[historyKey].push({ role: "user", content: userMessage });

    if (conversationHistory[historyKey].length > MAX_HISTORY * 2) {
      conversationHistory[historyKey] = conversationHistory[historyKey].slice(-MAX_HISTORY * 2);
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory[historyKey]
    ];

    let waitMsg;
    try {
      waitMsg = await new Promise((resolve) => {
        api.sendMessage("sandali lang...", threadID, (err, info) => resolve(info), messageID);
      });
    } catch (e) {}

    try {
      const reply = await callAI(messages);
      if (!reply) throw new Error("Empty response");

      conversationHistory[historyKey].push({ role: "assistant", content: reply });

      if (waitMsg) try { api.unsendMessage(waitMsg.messageID); } catch (e) {}

      await sendReply(api, threadID, messageID, reply);

    } catch (err) {
      if (waitMsg) try { api.unsendMessage(waitMsg.messageID); } catch (e) {}
      conversationHistory[historyKey].pop();
      return message.reply(getErrorMsg(err));
    }
  },

  onReply: async function ({ api, event, message }) {
    const { threadID, senderID, body } = event;
    if (!body) return;

    const historyKey = `${threadID}_${senderID}`;
    if (!conversationHistory[historyKey]) conversationHistory[historyKey] = [];

    conversationHistory[historyKey].push({ role: "user", content: body.trim() });

    if (conversationHistory[historyKey].length > MAX_HISTORY * 2) {
      conversationHistory[historyKey] = conversationHistory[historyKey].slice(-MAX_HISTORY * 2);
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory[historyKey]
    ];

    let waitMsg;
    try {
      waitMsg = await new Promise((resolve) => {
        api.sendMessage("sandali lang...", threadID, (err, info) => resolve(info), event.messageID);
      });
    } catch (e) {}

    try {
      const reply = await callAI(messages);
      if (!reply) throw new Error("Empty response");

      conversationHistory[historyKey].push({ role: "assistant", content: reply });

      if (waitMsg) try { api.unsendMessage(waitMsg.messageID); } catch (e) {}

      await sendReply(api, threadID, event.messageID, reply);

    } catch (err) {
      if (waitMsg) try { api.unsendMessage(waitMsg.messageID); } catch (e) {}
      conversationHistory[historyKey].pop();
      return message.reply(getErrorMsg(err));
    }
  }
};
