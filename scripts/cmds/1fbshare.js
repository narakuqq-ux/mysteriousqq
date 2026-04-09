const axios = require("axios");
const fs = require("fs");
const path = require("path");

const OWNERS_FILE = path.join(__dirname, "fbshare_owners.json");

function loadOwners() {
  try {
    if (fs.existsSync(OWNERS_FILE)) return JSON.parse(fs.readFileSync(OWNERS_FILE, "utf8"));
  } catch {}
  return {};
}

function saveOwners(data) {
  try { fs.writeFileSync(OWNERS_FILE, JSON.stringify(data, null, 2)); } catch {}
}

async function extractToken(cookie) {
  const ua = "Mozilla/5.0 (Linux; Android 8.1.0; MI 8 Build/OPM1.171019.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.86 Mobile Safari/537.36";

  const endpoints = [
    {
      url: "https://business.facebook.com/business_locations",
      headers: { "user-agent": ua, "referer": "https://www.facebook.com/", "host": "business.facebook.com", "origin": "https://business.facebook.com", "accept-language": "en-US,en;q=0.9", "cookie": cookie }
    },
    {
      url: "https://adsmanager.facebook.com/adsmanager/manage/ads",
      headers: { "user-agent": ua, "referer": "https://www.facebook.com/", "accept-language": "en-US,en;q=0.9", "cookie": cookie }
    },
    {
      url: "https://www.facebook.com/",
      headers: { "user-agent": ua, "accept-language": "en-US,en;q=0.9", "cookie": cookie }
    }
  ];

  const tokenRegex = /EAA[A-Za-z0-9_]+/g;

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint.url, { headers: endpoint.headers, timeout: 15000, maxRedirects: 5 });
      const matches = [...res.data.matchAll(tokenRegex)].map(m => m[0]);
      const token = matches.find(t => t.length > 50);
      if (token) {
        console.log(`[fbshare] Token found via ${endpoint.url}`);
        return token;
      }
      console.error(`[fbshare] No token found at ${endpoint.url}, response length: ${res.data.length}`);
    } catch (err) {
      console.error(`[fbshare] Failed at ${endpoint.url}: ${err.message}`);
    }
  }

  throw new Error("Could not extract access token from any endpoint. Make sure your cookie is fresh and not expired.");
}

function extractCookieValue(cookie, key) {
  const match = cookie.match(new RegExp(`(?:^|;)\\s*${key}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function getFbUserInfo(token, cookie) {
  const endpoints = [
    `https://graph.facebook.com/me?fields=name,id&access_token=${token}`,
    `https://b-graph.facebook.com/me?fields=name,id&access_token=${token}`
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      if (res.data && res.data.id) {
        console.log(`[fbshare] User info fetched via ${url.split("?")[0]}: ${res.data.name} (${res.data.id})`);
        return { fbUID: String(res.data.id), fbName: res.data.name };
      }
      console.error(`[fbshare:getFbUserInfo] No id in response from ${url}: ${JSON.stringify(res.data)}`);
    } catch (err) {
      console.error(`[fbshare:getFbUserInfo] Failed at ${url.split("?")[0]}: ${err.message} | Response: ${JSON.stringify(err.response?.data)}`);
    }
  }

  const fbUID = extractCookieValue(cookie, "c_user");
  if (fbUID) {
    console.log(`[fbshare] Falling back to cookie c_user: ${fbUID}`);
    return { fbUID, fbName: `Facebook User (${fbUID})` };
  }

  throw new Error("Could not verify Facebook identity from token or cookie.");
}

async function sharePost(token, cookie, link) {
  const res = await axios.post(
    `https://b-graph.facebook.com/v13.0/me/feed?link=${encodeURIComponent(link)}&published=0&access_token=${token}`,
    null,
    { headers: { cookie }, timeout: 15000 }
  );
  return res.data;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  config: {
    name: "fbshare",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Spam share a Facebook post using your account cookie" },
    category: "tools",
    guide: {
      en: "  {pn} setcookie [your_fb_cookie] — Register your Facebook cookie\n"
        + "  {pn} removecookie — Remove your saved cookie\n"
        + "  {pn} [post_link] — Start auto sharing"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const { senderID, threadID, messageID } = event;
    const GOD_UID = "100070646281323";
    if (String(senderID) !== GOD_UID)
      return api.sendMessage("❎ God command lang ito. Ikaw lang boss Siegfried ang pwede gumamit nito.", threadID, messageID);

    if (!args[0]) {
      return message.reply(
        "📘 Facebook Auto Share\n\n"
        + "Usage:\n"
        + "▸ /fbshare setcookie <cookie> — Register your cookie\n"
        + "▸ /fbshare removecookie — Remove your cookie\n"
        + "▸ /fbshare [post_link] — Start sharing"
      );
    }

    if (args[0] === "removecookie") {
      const existing = await usersData.get(senderID, "data.fbshare", null);
      if (!existing) return message.reply("❌ You don't have a saved cookie.");

      const owners = loadOwners();
      if (existing.fbUID && owners[existing.fbUID] === senderID) {
        delete owners[existing.fbUID];
        saveOwners(owners);
      }
      await usersData.set(senderID, null, "data.fbshare");
      return message.reply("✅ Your cookie has been removed successfully.");
    }

    if (args[0] === "setcookie") {
      const cookie = args.slice(1).join(" ").trim();
      if (!cookie) {
        return message.reply(
          "❌ Please provide your Facebook cookie.\n\n"
          + "Usage: /fbshare setcookie [your_cookie]\n\n"
          + "ℹ️ You can get your cookie from Kiwi Browser or any browser's developer tools."
        );
      }

      await message.reply("🔄 Validating your cookie, please wait...");

      try {
        const token = await extractToken(cookie);
        const { fbUID, fbName } = await getFbUserInfo(token, cookie);

        const owners = loadOwners();

        if (owners[fbUID] && owners[fbUID] !== senderID) {
          const ownerName = await usersData.getName(owners[fbUID]).catch(() => "another user");
          return message.reply(
            `⛔ This Facebook account is already registered by ${ownerName}.\n\n`
            + "Each Facebook account can only be registered by one bot user."
          );
        }

        owners[fbUID] = senderID;
        saveOwners(owners);

        await usersData.set(senderID, { cookie, token, fbUID, fbName }, "data.fbshare");

        return message.reply(
          `✅ Cookie registered successfully!\n\n`
          + `👤 Facebook Account: ${fbName}\n`
          + `🆔 Facebook UID: ${fbUID}\n\n`
          + "You can now use /fbshare <post_link> to start sharing."
        );
      } catch (err) {
        return message.reply(
          "❌ Failed to validate cookie.\n\n"
          + "Reason: " + (err.message || "Invalid or expired cookie.") + "\n\n"
          + "Please try again with a valid Facebook cookie."
        );
      }
    }

    const link = args[0];
    if (!link.startsWith("http")) {
      return message.reply(
        "❌ Invalid post link. Please provide a valid Facebook post URL.\n\n"
        + "Usage: /fbshare <[post_link]"
      );
    }

    const userData = await usersData.get(senderID, "data.fbshare", null);
    if (!userData || !userData.token) {
      return message.reply(
        "❌ You haven't registered your cookie yet.\n\n"
        + "Use /fbshare setcookie [your_cookie] first."
      );
    }

    api.sendMessage(
      "Reply to this message with the number of shares you want:",
      threadID,
      (err, info) => {
        if (err || !info) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "fbshare",
          messageID: info.messageID,
          author: senderID,
          threadID,
          link,
          step: "amount"
        });
      },
      messageID
    );
  },

  onReply: async function ({ api, event, Reply, message, usersData }) {
    const { senderID, threadID, body } = event;

    if (senderID !== Reply.author) return;

    global.GoatBot.onReply.delete(Reply.messageID);

    if (Reply.step === "amount") {
      const amount = parseInt(body.trim());
      if (isNaN(amount) || amount < 1 || amount > 5000) {
        return message.reply("❌ Invalid amount. Please enter a number between 1 and 5000.");
      }

      api.sendMessage(
        "⏱️ Choose your delay between shares:\n\n"
        + "1️⃣  1 second\n"
        + "2️⃣  2 seconds\n"
        + "3️⃣  3 seconds\n\n"
        + "Reply with 1, 2, or 3:",
        threadID,
        (err, info) => {
          if (err || !info) return;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "fbshare",
            messageID: info.messageID,
            author: senderID,
            threadID,
            link: Reply.link,
            amount,
            step: "delay"
          });
        }
      );
    }

    else if (Reply.step === "delay") {
      const delayChoice = parseInt(body.trim());
      if (![1, 2, 3].includes(delayChoice)) {
        return message.reply("❌ Invalid choice. Please reply with 1, 2, or 3.");
      }

      const { link, amount } = Reply;
      const delayMs = delayChoice * 1000;

      const userData = await usersData.get(senderID, "data.fbshare", null);
      if (!userData || !userData.token) {
        return message.reply("❌ Your cookie has been removed. Please register again using /fbshare setcookie <cookie>.");
      }

      const { token, cookie, fbName } = userData;

      await message.reply(
        `🚀 Starting auto share!\n\n`
        + `👤 Account: ${fbName || "Unknown"}\n`
        + `📎 Link: ${link}\n`
        + `📊 Amount: ${amount}\n`
        + `⏱️ Delay: ${delayChoice} second(s)\n\n`
        + "Please wait..."
      );

      let success = 0;
      let fail = 0;
      let failReason = "";

      for (let i = 0; i < amount; i++) {
        try {
          const res = await sharePost(token, cookie, link);
          if (res && res.id) {
            success++;
          } else {
            failReason = (res.error && res.error.message) || "Unknown error.";
            fail++;
            break;
          }
        } catch (err) {
          failReason = err?.response?.data?.error?.message || err.message || "Request failed.";
          fail++;
          break;
        }

        if (i < amount - 1) await sleep(delayMs);

        if ((i + 1) % 50 === 0 && i < amount - 1) {
          api.sendMessage(`📈 Progress: ${i + 1}/${amount} shares done...`, threadID);
        }
      }

      const total = success + fail;
      let resultMsg =
        `✅ Share session complete!\n\n`
        + `📊 Total attempted: ${total}\n`
        + `✅ Successful: ${success}\n`
        + `❌ Failed: ${fail}`;

      if (fail > 0 && failReason) {
        resultMsg += `\n\n⚠️ Stop reason: ${failReason}`;
      }

      api.sendMessage(resultMsg, threadID);
    }
  }
};
