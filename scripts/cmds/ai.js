const axios = require("axios");

const API_KEY = "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";
const BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL = "nvidia/nemotron-super-49b-v1";

const conversationHistory = {};
const MAX_HISTORY = 10;

module.exports = {
  config: {
    name: "ai",
    version: "1.0.0",
    author: "Custom",
    countDown: 3,
    role: 0,
    description: { en: "Chat with NVIDIA Nemotron AI (no prefix needed)" },
    category: "ai",
    guide: { en: "Just type: ai <your question>" }
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

    let userMessage = text;
    if (isAiTrigger) {
      userMessage = text.slice(2).trim();
    }

    if (!userMessage) {
      return message.reply("❓ Anong tanong mo? Halimbawa: ai ano ang AI?");
    }

    const historyKey = `${threadID}_${senderID}`;
    if (!conversationHistory[historyKey]) {
      conversationHistory[historyKey] = [];
    }

    conversationHistory[historyKey].push({
      role: "user",
      content: userMessage
    });

    if (conversationHistory[historyKey].length > MAX_HISTORY * 2) {
      conversationHistory[historyKey] = conversationHistory[historyKey].slice(-MAX_HISTORY * 2);
    }

    const messages = [
      {
        role: "system",
        content: "You are a helpful, friendly, and knowledgeable AI assistant. Answer clearly and concisely. If asked in Filipino/Tagalog, respond in Filipino."
      },
      ...conversationHistory[historyKey]
    ];

    let waitMsg;
    try {
      waitMsg = await new Promise((resolve) => {
        api.sendMessage("🤖 Nag-iisip...", threadID, (err, info) => {
          resolve(info);
        }, messageID);
      });
    } catch (e) {}

    try {
      const response = await axios.post(
        `${BASE_URL}/chat/completions`,
        {
          model: MODEL,
          messages: messages,
          temperature: 1,
          top_p: 0.95,
          max_tokens: 4096,
          stream: false
        },
        {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 60000
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content;

      if (!reply) {
        throw new Error("Empty response from API");
      }

      conversationHistory[historyKey].push({
        role: "assistant",
        content: reply
      });

      if (waitMsg) {
        try { api.unsendMessage(waitMsg.messageID); } catch (e) {}
      }

      const MAX_LENGTH = 2000;
      if (reply.length <= MAX_LENGTH) {
        return message.reply(`🤖 ${reply}`);
      }

      const parts = [];
      for (let i = 0; i < reply.length; i += MAX_LENGTH) {
        parts.push(reply.slice(i, i + MAX_LENGTH));
      }

      for (let i = 0; i < parts.length; i++) {
        const prefix = parts.length > 1 ? `🤖 [${i + 1}/${parts.length}]\n` : "🤖 ";
        await new Promise((resolve) => {
          api.sendMessage(prefix + parts[i], threadID, resolve, messageID);
        });
      }

    } catch (err) {
      if (waitMsg) {
        try { api.unsendMessage(waitMsg.messageID); } catch (e) {}
      }

      conversationHistory[historyKey].pop();

      let errorMsg = "❌ May error sa AI. Subukan ulit mamaya.";

      if (err.response) {
        const status = err.response.status;
        if (status === 401) errorMsg = "❌ Invalid API key.";
        else if (status === 429) errorMsg = "❌ Rate limit reached. Subukan ulit pagkatapos ng ilang segundo.";
        else if (status === 500) errorMsg = "❌ Server error sa AI. Subukan ulit mamaya.";
        else if (status === 503) errorMsg = "❌ AI service ay hindi available ngayon. Subukan ulit mamaya.";
      } else if (err.code === "ECONNABORTED") {
        errorMsg = "❌ Timeout. Masyado matagal ang response. Subukan ulit.";
      }

      return message.reply(errorMsg);
    }
  },

  onReply: async function ({ api, event, message }) {
    const { threadID, senderID, body } = event;
    if (!body) return;

    const historyKey = `${threadID}_${senderID}`;
    if (!conversationHistory[historyKey]) {
      conversationHistory[historyKey] = [];
    }

    conversationHistory[historyKey].push({
      role: "user",
      content: body.trim()
    });

    if (conversationHistory[historyKey].length > MAX_HISTORY * 2) {
      conversationHistory[historyKey] = conversationHistory[historyKey].slice(-MAX_HISTORY * 2);
    }

    const messages = [
      {
        role: "system",
        content: "You are a helpful, friendly, and knowledgeable AI assistant. Answer clearly and concisely. If asked in Filipino/Tagalog, respond in Filipino."
      },
      ...conversationHistory[historyKey]
    ];

    let waitMsg;
    try {
      waitMsg = await new Promise((resolve) => {
        api.sendMessage("🤖 Nag-iisip...", threadID, (err, info) => {
          resolve(info);
        }, event.messageID);
      });
    } catch (e) {}

    try {
      const response = await axios.post(
        `${BASE_URL}/chat/completions`,
        {
          model: MODEL,
          messages: messages,
          temperature: 1,
          top_p: 0.95,
          max_tokens: 4096,
          stream: false
        },
        {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 60000
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content;

      if (!reply) throw new Error("Empty response");

      conversationHistory[historyKey].push({
        role: "assistant",
        content: reply
      });

      if (waitMsg) {
        try { api.unsendMessage(waitMsg.messageID); } catch (e) {}
      }

      const MAX_LENGTH = 2000;
      if (reply.length <= MAX_LENGTH) {
        return message.reply(`🤖 ${reply}`);
      }

      const parts = [];
      for (let i = 0; i < reply.length; i += MAX_LENGTH) {
        parts.push(reply.slice(i, i + MAX_LENGTH));
      }

      for (let i = 0; i < parts.length; i++) {
        const prefix = parts.length > 1 ? `🤖 [${i + 1}/${parts.length}]\n` : "🤖 ";
        await new Promise((resolve) => {
          api.sendMessage(prefix + parts[i], threadID, resolve, event.messageID);
        });
      }

    } catch (err) {
      if (waitMsg) {
        try { api.unsendMessage(waitMsg.messageID); } catch (e) {}
      }

      conversationHistory[historyKey].pop();

      let errorMsg = "❌ May error sa AI. Subukan ulit mamaya.";
      if (err.code === "ECONNABORTED") errorMsg = "❌ Timeout. Subukan ulit.";
      return message.reply(errorMsg);
    }
  }
};
