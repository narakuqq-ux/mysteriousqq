module.exports = {
  config: {
    name: "fbcookie",
    version: "2.0.0",
    author: "Siegfried Samá",
    countDown: 15,
    role: 2,
    description: { en: "Get Facebook cookie/appState from email and password" },
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

    const waitMsg = await message.reply("🔄 Logging into Facebook, please wait (up to 20s)...");

    try {
      const appState = await new Promise((resolve, reject) => {
        const login = require("fca-unofficial");
        login(
          { email, password },
          { logLevel: "silent", forceLogin: true },
          (err, api) => {
            if (err) return reject(err);
            try {
              resolve(api.getAppState());
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      const cookieStr = appState
        .map((c) => `${c.key}=${c.value}`)
        .join("; ");

      const uid =
        appState.find((c) => c.key === "c_user")?.value || "Unknown";

      return message.reply(
        `✅ Login successful!\n\n` +
          `👤 UID: ${uid}\n\n` +
          `🍪 Cookie:\n${cookieStr}\n\n` +
          `⚠️ Keep this private! Never share it.`
      );
    } catch (err) {
      const msg = err.error || err.message || String(err);
      const friendly =
        msg.includes("Wrong username") || msg.includes("password")
          ? "❌ Wrong email/password. Double-check your credentials."
          : msg.includes("checkpoint") || msg.includes("Checkpoint")
          ? "❌ Account needs checkpoint verification.\nGo to facebook.com and verify first, then try again."
          : msg.includes("approvals") || msg.includes("2FA") || msg.includes("two-factor")
          ? "❌ Account has 2-factor authentication (Login Approvals).\nDisable it temporarily or approve the login on your phone."
          : `❌ Login failed: ${msg}`;
      return message.reply(friendly);
    }
  },
};
