const axios = require("axios");

function randomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

module.exports = {
  config: {
    name: "fbcookie",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 10,
    role: 2,
    description: { en: "Get Facebook access cookie from email/number and password" },
    category: "owner",
    guide: { en: "{pn} <email or phone> <password>" },
  },

  onStart: async function ({ message, args, event, api }) {
    if (args.length < 2) {
      return message.reply(
        "📌 Usage: .fbcookie <email/phone> <password>\n\n⚠️ Admin only command. Never share your cookie with anyone."
      );
    }

    const email = args[0];
    const password = args.slice(1).join(" ");
    const deviceId = randomUUID();

    await message.reply("🔄 Logging into Facebook, please wait...");

    try {
      const res = await axios.get("https://b-api.facebook.com/method/auth.login", {
        params: {
          api_key: "882a8490361da98702bf97a021ddc14d",
          access_token: "350685531728|62f8ce9f74b12f84c123cc81a72410d8",
          generate_session_cookies: "1",
          generate_analytics_claim: "1",
          generate_machine_id: "1",
          email,
          password,
          format: "json",
          device_id: deviceId,
          locale: "en_US",
          return_multiple_errors: "1",
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 20000,
      });

      const data = res.data;

      if (data.error_code) {
        const msg =
          data.error_code === 401
            ? "❌ Wrong email/password. Please check your credentials."
            : data.error_code === 406
            ? "❌ Account requires checkpoint verification. Complete it on Facebook first."
            : `❌ Facebook error ${data.error_code}: ${data.error_msg || "Unknown error"}`;
        return message.reply(msg);
      }

      if (!data.session_cookies || data.session_cookies.length === 0) {
        return message.reply(
          "❌ No cookies returned. This may mean:\n• Account requires 2FA\n• Account needs checkpoint verification\n• Facebook blocked this login attempt"
        );
      }

      const cookieStr = data.session_cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      const uid = data.uid || data.session_cookies.find((c) => c.name === "c_user")?.value || "Unknown";
      const token = data.access_token || "Not returned";

      const reply =
        `✅ Login successful!\n\n` +
        `👤 UID: ${uid}\n\n` +
        `🍪 Cookie:\n${cookieStr}\n\n` +
        `🔑 Access Token:\n${token}\n\n` +
        `⚠️ Keep this private! Never share it.`;

      return message.reply(reply);
    } catch (err) {
      const errMsg = err.response?.data?.error_msg || err.message;
      return message.reply(`❌ Request failed: ${errMsg}`);
    }
  },
};
