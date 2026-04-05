const axios = require("axios");

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
      en: "  {pn} settoken <your_fb_token> — I-save ang iyong Facebook access token\n"
        + "  {pn} removetoken — Alisin ang saved token\n"
        + "  {pn} <fb_url_or_uid> [reason] — Mag-report ng account\n\n"
        + "  Reasons: spam (default), fake, abuse, violence, hate"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const { senderID, threadID } = event;

    if (!args[0]) {
      return message.reply(
        "📋 Report Command (Admin Only)\n\n"
        + "Mga command:\n"
        + "▸ report settoken <token> — I-save ang FB token mo\n"
        + "▸ report removetoken — Alisin ang token\n"
        + "▸ report <url_o_uid> [reason] — Mag-report\n\n"
        + "Mga dahilan: spam, fake, abuse, violence, hate\n\n"
        + "Paano makuha ang token:\n"
        + "1. Pumunta sa: https://developers.facebook.com/tools/explorer\n"
        + "2. Mag-login sa iyong FB account\n"
        + "3. I-click ang 'Generate Access Token'\n"
        + "4. I-copy at i-type: report settoken <token>"
      );
    }

    if (args[0].toLowerCase() === "settoken") {
      const token = args.slice(1).join(" ").trim();
      if (!token) {
        return message.reply(
          "❌ Walang token na ibinigay!\n\n"
          + "Paggamit: report settoken <your_fb_token>"
        );
      }

      await message.reply("🔄 Vini-verify ang token, sandali lang...");

      try {
        const res = await axios.get(
          `https://graph.facebook.com/me?fields=name,id&access_token=${token}`,
          { timeout: 10000 }
        );

        if (!res.data || !res.data.id) {
          return message.reply("❌ Hindi valid ang token. Subukan ulit.");
        }

        const { name, id } = res.data;
        await usersData.set(senderID, { token, fbName: name, fbUID: id }, "data.reporttoken");

        return message.reply(
          `✅ Token na-save!\n\n`
          + `👤 Account: ${name}\n`
          + `🆔 FB UID: ${id}\n\n`
          + "Pwede ka na mag-report gamit ang: report <url_o_uid>"
        );
      } catch (err) {
        return message.reply(
          "❌ Hindi ma-verify ang token.\n\n"
          + "Dahilan: " + (err.response?.data?.error?.message || err.message || "Invalid o expired na token.")
        );
      }
    }

    if (args[0].toLowerCase() === "removetoken") {
      const existing = await usersData.get(senderID, "data.reporttoken", null);
      if (!existing) return message.reply("❌ Wala kang saved na token.");

      await usersData.set(senderID, null, "data.reporttoken");
      return message.reply("✅ Na-remove na ang iyong token.");
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
    if (urlMatch) {
      objectId = urlMatch[1];
    }

    const userData = await usersData.get(senderID, "data.reporttoken", null);
    if (!userData || !userData.token) {
      return message.reply(
        "❌ Wala kang saved na FB token!\n\n"
        + "I-set mo muna gamit ang: report settoken <your_fb_token>"
      );
    }

    const { token, fbName } = userData;

    const reportingMsg = await message.reply(
      `⏳ Nire-report ang account...\n\n`
      + `👤 Gamit: ${fbName}\n`
      + `🎯 Target: ${objectId}\n`
      + `📋 Dahilan: ${reasonInput.toUpperCase()}`
    );

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${objectId}/reports`,
        null,
        {
          params: {
            reason: reason,
            access_token: token
          },
          timeout: 15000
        }
      );

      if (response.data && response.data.success) {
        return api.editMessage(
          `✅ Na-report na!\n\n`
          + `👤 Gamit: ${fbName}\n`
          + `🎯 Target: ${objectId}\n`
          + `📋 Dahilan: ${reasonInput.toUpperCase()}\n`
          + `📊 Status: Matagumpay`,
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
