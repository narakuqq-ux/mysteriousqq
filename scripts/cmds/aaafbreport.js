module.exports = {
  config: {
    name: "fbreport",
    version: "6.1.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 2,
    description: { en: "Report a Facebook account (Bot Admin/God only)" },
    category: "utility",
    guide: {
      en: "  {pn} <fb_url_or_uid> [reason] [count]\n\n"
        + "  Reasons: spam (default), fake, abuse, violence, hate\n"
        + "  Count: 1-10 (default: 1)\n\n"
        + "  Examples:\n"
        + "  {pn} 100012345678 spam 10\n"
        + "  {pn} https://www.facebook.com/username fake 5"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    if (!args[0]) {
      return message.reply(
        "📋 Report Command (Admin Only)\n\n"
        + "Usage:\n"
        + "▸ report <url_or_uid> [reason] [count]\n\n"
        + "Reasons: spam, fake, abuse, violence, hate\n"
        + "Count: 1-10\n\n"
        + "Examples:\n"
        + "report 100012345678 spam 10\n"
        + "report https://www.facebook.com/username fake 5"
      );
    }

    const input = args[0];
    const reasonInput = (args[1] || "spam").toLowerCase();
    const count = Math.min(10, Math.max(1, parseInt(args[2]) || 1));

    const reasonMap = {
      spam: "1",
      fake: "2",
      abuse: "3",
      violence: "4",
      hate: "5"
    };
    const reasonCode = reasonMap[reasonInput] || "1";

    let objectId = input;
    const uidFromUrl = input.match(/profile\.php\?id=(\d+)/i);
    const usernameFromUrl = input.match(/facebook\.com\/([^/?&\s]+)/i);
    if (uidFromUrl) objectId = uidFromUrl[1];
    else if (usernameFromUrl) objectId = usernameFromUrl[1];

    const reportingMsg = await message.reply(
      `⏳ Starting...\n\n🎯 Target: ${objectId}\n📋 Reason: ${reasonInput.toUpperCase()}\n🔁 Count: ${count}`
    );

    // Step 1: Resolve username to UID if needed
    if (!/^\d+$/.test(objectId)) {
      try {
        await api.editMessage(`⏳ Fetching UID for "${objectId}"...`, reportingMsg.messageID);

        const html = await api.httpGet(`https://www.facebook.com/${objectId}`);

        const patterns = [
          /"userID":"(\d+)"/,
          /"uid":(\d+)/,
          /"USER_ID":"(\d+)"/,
          /"ownerID":"(\d+)"/,
          /content_id=(\d+)/,
          /entity_id=(\d+)/,
          /profileOwnerID=(\d+)/,
        ];

        let resolved = null;
        for (const pat of patterns) {
          const match = html.match(pat);
          if (match) { resolved = match[1]; break; }
        }

        if (!resolved) throw new Error("Could not find UID from profile page. Try using the UID number directly.");

        console.log(`[report] Resolved "${objectId}" => UID: ${resolved}`);
        objectId = resolved;
      } catch (err) {
        console.error(`[report] UID resolve error: ${err.message}`);
        return api.editMessage(
          `❌ Could not find account!\n\n⚠️ ${err.message}`,
          reportingMsg.messageID
        );
      }
    }

    // Step 2: Report [count] times
    const form = {
      target_id: objectId,
      source: "profile",
      from_type: "1",
      content_type: reasonCode,
      subject_type: "1",
      __a: "1"
    };

    let success = 0;
    let failed = 0;

    for (let i = 1; i <= count; i++) {
      try {
        await api.editMessage(
          `⏳ Reporting... (${i}/${count})\n\n🎯 UID: ${objectId}\n📋 Reason: ${reasonInput.toUpperCase()}\n✅ Success: ${success} | ❌ Failed: ${failed}`,
          reportingMsg.messageID
        );

        const response = await api.httpPost(
          "https://www.facebook.com/ajax/report/social.php",
          form
        );

        const body = String(response);
        console.log(`[report] #${i} response: ${body.slice(0, 200)}`);

        const ok = !body.includes('"error"') && (body.includes('"success"') || body.includes('"data"') || body.length > 10);
        if (ok) success++;
        else failed++;

      } catch (err) {
        console.error(`[report] #${i} error: ${err.message}`);
        failed++;
      }

      if (i < count) await new Promise(r => setTimeout(r, 500));
    }

    return api.editMessage(
      `${success > 0 ? "✅" : "❌"} Done!\n\n`
      + `🎯 UID: ${objectId}\n`
      + `📋 Reason: ${reasonInput.toUpperCase()}\n`
      + `🔁 Total: ${count}\n`
      + `✅ Success: ${success}\n`
      + `❌ Failed: ${failed}`,
      reportingMsg.messageID
    );
  }
};
