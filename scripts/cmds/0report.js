const axios = require("axios");

let cachedToken = null;
let cachedTokenTime = 0;
const TOKEN_TTL = 1000 * 60 * 60;

async function extractTokenFromAppState(appState) {
  const cookieStr = appState
    .map(c => `${c.key}=${c.value}`)
    .join("; ");

  const ua = "Mozilla/5.0 (Linux; Android 8.1.0; MI 8 Build/OPM1.171019.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.86 Mobile Safari/537.36";
  const tokenRegex = /EAA[A-Za-z0-9_]+/g;

  const endpoints = [
    {
      url: "https://business.facebook.com/business_locations",
      headers: { "user-agent": ua, "referer": "https://www.facebook.com/", "host": "business.facebook.com", "origin": "https://business.facebook.com", "accept-language": "en-US,en;q=0.9", "cookie": cookieStr }
    },
    {
      url: "https://adsmanager.facebook.com/adsmanager/manage/ads",
      headers: { "user-agent": ua, "referer": "https://www.facebook.com/", "accept-language": "en-US,en;q=0.9", "cookie": cookieStr }
    },
    {
      url: "https://www.facebook.com/",
      headers: { "user-agent": ua, "accept-language": "en-US,en;q=0.9", "cookie": cookieStr }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint.url, { headers: endpoint.headers, timeout: 15000, maxRedirects: 5 });
      const matches = [...res.data.matchAll(tokenRegex)].map(m => m[0]);
      const token = matches.find(t => t.length > 50);
      if (token) return token;
    } catch (err) {}
  }

  throw new Error("hindi ma-extract ang token mula sa bot account. Baka expired na ang session.");
}

async function getToken(api) {
  const now = Date.now();
  if (cachedToken && now - cachedTokenTime < TOKEN_TTL) return cachedToken;

  const appState = api.getAppState();
  if (!appState || !appState.length) throw new Error("walang appstate ang bot. Hindi pa naka-login.");

  const token = await extractTokenFromAppState(appState);
  cachedToken = token;
  cachedTokenTime = now;
  return token;
}

module.exports = {
  config: {
    name: "report",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 1,
    description: { en: "sunog account" },
    category: "utility",
    guide: {
      en: "  {pn} <fb_url_or_uid> [reason] — Mag-report ng account\n\n"
        + "  Mga dahilan: spam (default), fake, abuse, violence, hate\n\n"
        + "  Halimbawa:\n"
        + "  {pn} https://www.facebook.com/username spam\n"
        + "  {pn} 100012345678 fake"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;

    if (!args[0]) {
      return message.reply(
        "📋 Report Command (Admin Only)\n\n"
        + "Paggamit:\n"
        + "▸ report <url_o_uid> [reason]\n\n"
        + "Mga dahilan:\n"
        + "• spam (default)\n"
        + "• fake\n"
        + "• abuse\n"
        + "• violence\n"
        + "• hate\n\n"
        + "Halimbawa:\n"
        + "report https://www.facebook.com/username spam\n"
        + "report 100012345678 fake"
      );
    }

    const input = args[0];
    const reasonInput = (args[1] || "spam").toLowerCase();

    const reasonMap = {
      spam: "SPAM",
      fake: "FAKE_ACCOUNT",
      abuse: "ABUSIVE_CONTENT",
      violence: "VIOLENCE",
      hate: "HATE_SPEECH"
    };

    const reason = reasonMap[reasonInput] || "SPAM";

    let objectId = input;
    const urlMatch = input.match(/facebook\.com\/(?:profile\.php\?id=)?([^/?&\s]+)/i);
    if (urlMatch) objectId = urlMatch[1];

    const reportingMsg = await message.reply(
      `⏳ kukunin ang token ng bot account...\n\n`
      + `🎯 Target: ${objectId}\n`
      + `📋 Dahilan: ${reasonInput.toUpperCase()}`
    );

    let token;
    try {
      token = await getToken(api);
    } catch (err) {
      return api.editMessage(
        `❌ hindi makuha ang token!\n\n⚠️ ${err.message}`,
        reportingMsg.messageID,
        threadID
      );
    }

    try {
      await api.editMessage(
        `⏳ Nire-report na ang account...\n\n`
        + ` Target: ${objectId}\n`
        + ` Reason: ${reasonInput.toUpperCase()}`,
        reportingMsg.messageID,
        threadID
      );

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${objectId}/reports`,
        null,
        {
          params: { reason, access_token: token },
          timeout: 15000
        }
      );

      if (response.data && response.data.success) {
        return api.editMessage(
          `✅ Na-report na!\n\n`
          + ` Target: ${objectId}\n`
          + ` Reason: ${reasonInput.toUpperCase()}\n`
          + ` Status: Success`,
          reportingMsg.messageID,
          threadID
        );
      } else {
        return api.editMessage(
          `⚠️ Di sigurado kung na-report:\n\n`
          + `🎯 Target: ${objectId}\n`
          + `📝 Response: ${JSON.stringify(response.data)}`,
          reportingMsg.messageID,
          threadID
        );
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message || "Hindi kilala ang error";
      return api.editMessage(
        `❌ May error sa pag-report!\n\n`
        + `🎯 Target: ${objectId}\n`
        + `⚠️ Error: ${errMsg}`,
        reportingMsg.messageID,
        threadID
      );
    }
  }
};
