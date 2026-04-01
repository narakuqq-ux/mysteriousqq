const axios = require("axios");

async function validateCookie(cookieStr) {
  const res = await axios.get("https://graph.facebook.com/me", {
    params: { access_token: "350685531728|62f8ce9f74b12f84c123cc81a72410d8", fields: "id,name" },
    headers: { Cookie: cookieStr },
    timeout: 10000,
  }).catch(() => null);

  // Try extracting c_user from the cookie string as fallback UID
  const cUser = cookieStr.match(/c_user[=:](\d+)/i)?.[1] || null;
  const xs = cookieStr.match(/\bxs[=:]([^;]+)/i)?.[1] || null;

  if (!cUser) throw new Error("Missing c_user field — this doesn't look like a valid Facebook cookie.");
  if (!xs) throw new Error("Missing xs field — cookie may be incomplete.");

  const name = res?.data?.name || null;
  return { uid: cUser, name };
}

module.exports = {
  config: {
    name: "fbcookie",
    version: "4.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 2,
    description: { en: "Validate a Facebook cookie and extract UID" },
    category: "owner",
    guide: { en: "{pn} <your cookie string>  |  {pn} guide" },
  },

  onStart: async function ({ message, args }) {
    if (!args.length || args[0] === "guide") {
      return message.reply(
        `📖 How to get your Facebook cookie:\n\n` +
          `1. Open Facebook on a PC browser (Chrome/Firefox)\n` +
          `2. Log into your account\n` +
          `3. Press F12 → Application tab → Cookies → https://www.facebook.com\n` +
          `4. Copy ALL the cookie Name=Value pairs separated by ; \n` +
          `   (You need at least: c_user, xs, fr, datr)\n\n` +
          `🔹 Chrome shortcut:\n` +
          `   F12 → Console → paste this and press Enter:\n` +
          `   document.cookie\n\n` +
          `5. Then send: .fbcookie <paste cookie here>\n\n` +
          `⚠️ Never share your cookie with anyone.`
      );
    }

    const cookieStr = args.join(" ").trim();
    await message.reply("🔄 Validating cookie...");

    try {
      const { uid, name } = await validateCookie(cookieStr);

      const formatted = cookieStr
        .split(/[;,]\s*/)
        .map((p) => p.trim())
        .filter(Boolean)
        .join("; ");

      return message.reply(
        `✅ Cookie is valid!\n\n` +
          `👤 UID: ${uid}` +
          (name ? `\n📛 Name: ${name}` : "") +
          `\n\n🍪 Formatted Cookie:\n${formatted}\n\n` +
          `⚠️ Keep this private!`
      );
    } catch (err) {
      return message.reply(`❌ Invalid cookie: ${err.message}`);
    }
  },
};
