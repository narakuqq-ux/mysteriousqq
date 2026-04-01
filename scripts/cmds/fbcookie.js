const axios = require("axios");

const API_KEY = "882a8490361da98702bf97a021ddc14d";
const CLIENT_SECRET = "62f8ce9f74b12f84c123cc81a72410d8";

function md5(str) {
  const { createHash } = require("crypto");
  return createHash("md5").update(str).digest("hex");
}

function calcSig(params) {
  const sorted = Object.keys(params).sort();
  const sigStr = sorted.map((k) => `${k}=${params[k]}`).join("") + CLIENT_SECRET;
  return md5(sigStr);
}

module.exports = {
  config: {
    name: "fbcookie",
    version: "1.1.0",
    author: "Siegfried Samá",
    countDown: 10,
    role: 2,
    description: { en: "Get Facebook cookie from email/number and password" },
    category: "owner",
    guide: { en: "{pn} <email or phone> <password>" },
  },

  onStart: async function ({ message, args }) {
    if (args.length < 2) {
      return message.reply(
        "📌 Usage: .fbcookie <email/phone> <password>\n\n⚠️ Admin only. Never share your cookie with anyone."
      );
    }

    const email = args[0];
    const password = args.slice(1).join(" ");

    await message.reply("🔄 Logging into Facebook, please wait...");

    try {
      const params = {
        api_key: API_KEY,
        email,
        format: "json",
        generate_session_cookies: "1",
        locale: "en_US",
        method: "auth.login",
        password,
        v: "1.0",
      };

      params.sig = calcSig(params);

      const res = await axios.post(
        "https://b-api.facebook.com/method/auth.login",
        new URLSearchParams(params).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent":
              "[FBAN/FB4A;FBAV/35.0.0.48.273;FBBV/13677583;FBDM/{density=4.0,width=1440,height=2560};FBLC/en_US;FBCR/;FBMF/samsung;FBBD/samsung;FBPN/com.facebook.katana;FBDV/SM-G900F;FBSV/6.0.1;FBOQ/0;FB_FW/0;]",
            "Accept-Language": "en-US,en;q=0.9",
          },
          timeout: 20000,
        }
      );

      const data = res.data;

      if (data.error_code) {
        const msg =
          data.error_code === 401
            ? "❌ Wrong email/password. Double-check your credentials."
            : data.error_code === 406
            ? "❌ Account locked/checkpoint. Verify your account on Facebook first."
            : data.error_code === 190
            ? `❌ Auth failed (190): ${data.error_msg}`
            : `❌ Facebook error ${data.error_code}: ${data.error_msg || "Unknown"}`;
        return message.reply(msg);
      }

      if (!data.session_cookies || data.session_cookies.length === 0) {
        return message.reply(
          "❌ No cookies returned.\nPossible reasons:\n• 2FA is enabled\n• Checkpoint verification needed\n• Facebook blocked this login"
        );
      }

      const cookieStr = data.session_cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      const uid =
        data.uid ||
        data.session_cookies.find((c) => c.name === "c_user")?.value ||
        "Unknown";

      const token = data.access_token || "Not returned";

      return message.reply(
        `✅ Login successful!\n\n` +
          `👤 UID: ${uid}\n\n` +
          `🍪 Cookie:\n${cookieStr}\n\n` +
          `🔑 Token:\n${token}\n\n` +
          `⚠️ Keep this private!`
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error_msg ||
        err.response?.data ||
        err.message;
      return message.reply(`❌ Request failed: ${JSON.stringify(errMsg)}`);
    }
  },
};
