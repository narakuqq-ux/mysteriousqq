const axios = require("axios");

const TEMPMAIL_GEN   = "https://www.smfahim.xyz/tempmail/v1";
const TEMPMAIL_INBOX = "https://www.smfahim.xyz/tempmail/v1/inbox?email=";

const FIRST_NAMES = [
  "James","John","Robert","Michael","William","David","Richard","Joseph",
  "Thomas","Charles","Daniel","Matthew","Anthony","Mark","Steven","Paul",
  "Emma","Olivia","Ava","Isabella","Sophia","Mia","Charlotte","Amelia",
  "Harper","Evelyn","Abigail","Emily","Elizabeth","Sofia","Madison","Avery",
  "Ella","Scarlett","Grace","Chloe","Victoria","Riley","Aria","Lily",
  "Natalie","Savannah","Audrey","Brooklyn","Bella","Claire","Skylar","Lucy",
];
const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
  "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson",
  "Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson",
  "White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker",
];
const UA_LIST = [
  "Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.105 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
];

const rand  = arr => arr[Math.floor(Math.random() * arr.length)];
const sleep = ms  => new Promise(r => setTimeout(r, ms));

function randName()     { return [rand(FIRST_NAMES), rand(LAST_NAMES)]; }
function randPass()     { return `Pass${Math.floor(Math.random()*900+100)}${rand(['!','@','#','$','%'])}`; }
function randBirthday() {
  return {
    year:  Math.floor(Math.random() * 16) + 1985,
    month: String(Math.floor(Math.random() * 12) + 1).padStart(2,'0'),
    day:   String(Math.floor(Math.random() * 28) + 1).padStart(2,'0'),
  };
}

function parseCookies(setCookieArr = []) {
  const jar = {};
  for (const c of setCookieArr) {
    const m = c.match(/^([^=]+)=([^;]*)/);
    if (m) jar[m[1].trim()] = m[2].trim();
  }
  return jar;
}
function mergeCookies(...jars) { return Object.assign({}, ...jars); }
function cookieStr(jar) { return Object.entries(jar).map(([k,v]) => `${k}=${v}`).join('; '); }

async function getTempMail() {
  const r = await axios.get(TEMPMAIL_GEN, { timeout: 15000 });
  const email = r.data?.email || r.data?.data?.email || r.data?.mail;
  if (!email) throw new Error(`No email in response: ${JSON.stringify(r.data).slice(0,80)}`);
  return email;
}

async function getInbox(email, retries = 7, delay = 6000) {
  for (let i = 0; i < retries; i++) {
    await sleep(delay);
    try {
      const r = await axios.get(`${TEMPMAIL_INBOX}${encodeURIComponent(email)}`, { timeout: 15000 });
      const data = r.data;
      if (data?.error) continue;
      const msgs = data?.messages || data?.emails || data?.inbox || (Array.isArray(data) ? data : []);
      if (msgs && msgs.length > 0) {
        const m = JSON.stringify(msgs).match(/\b\d{5,6}\b/);
        if (m) return m[0];
      }
    } catch (e) {}
  }
  return null;
}

async function registerFB(first, last, email, password, year, month, day) {
  const ua = rand(UA_LIST);
  // NOTE: Do NOT include Accept-Encoding — it causes 400 from FB on some IPs
  const baseHeaders = {
    "User-Agent":                ua,
    "Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language":           "en-US,en;q=0.9",
    "Connection":                "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  let jar = {};

  // Step 1: Load mbasic reg page (accessible from server IPs)
  let html = "";
  try {
    const r = await axios.get("https://mbasic.facebook.com/r.php", {
      headers: baseHeaders,
      timeout: 20000,
      maxRedirects: 5,
    });
    if (r.status === 200 && r.data && r.data.length > 1000) {
      html = r.data;
      jar  = parseCookies(r.headers['set-cookie']);
    }
  } catch (e) {
    return { failed: true, reason: `Reg page load failed: ${e.response?.status || e.message}`, raw: "" };
  }

  if (!html) return { failed: true, reason: "Empty response from FB reg page", raw: "" };

  // Step 2: Extract CSRF tokens from embedded JS
  const lsd     = html.match(/"lsd","token":"([^"]+)"/)?.[1] || "";
  const jazoest = html.match(/"initSprinkleValue":"(\d+)"/)?.[1] ||
                  html.match(/jazoest.*?(\d{8,})/)?.[1] || "";

  if (!lsd) return { failed: true, reason: "Could not extract lsd token from page", raw: html.slice(0,200) };

  // Step 3: Submit registration form
  const sex = Math.random() > 0.5 ? '1' : '2';
  const formObj = {
    firstname:                first,
    lastname:                 last,
    reg_email__:              email,
    reg_email_confirmation__: email,
    reg_passwd__:             password,
    birthday_day:             String(parseInt(day)),
    birthday_month:           String(parseInt(month)),
    birthday_year:            String(year),
    sex,
    locale:                   "en_US",
    submit:                   "Sign Up",
    referrer:                 "",
    asked_to_login:           "0",
    terms:                    "on",
    lsd,
    jazoest,
  };

  const formBody  = new URLSearchParams(formObj).toString();
  const postHeaders = {
    ...baseHeaders,
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer":      "https://mbasic.facebook.com/r.php",
    "Origin":       "https://mbasic.facebook.com",
    "Cookie":       cookieStr(jar),
  };

  const submitUrls = [
    "https://www.facebook.com/reg/submit/",
    "https://mbasic.facebook.com/reg/submit/",
    "https://m.facebook.com/reg/submit/",
  ];

  for (const url of submitUrls) {
    let r;
    try {
      r = await axios.post(url, formBody, {
        headers: postHeaders,
        timeout: 25000,
        maxRedirects: 10,
      });
    } catch (e) {
      continue;
    }

    const finalUrl  = r.request?.res?.responseUrl || r.config?.url || "";
    const raw       = typeof r.data === "string" ? r.data.slice(0, 500) : "";
    const text      = raw.toLowerCase();
    const postJar   = parseCookies(r.headers['set-cookie']);
    const cUser     = postJar['c_user'] || "";

    // Success: got login cookie
    if (cUser) return { uid: cUser, raw };

    // Success: redirected to home/feed
    if (['home.php', '/feed', 'welcome', 'a=home'].some(x => finalUrl.includes(x)))
      return { uid: "registered", raw };

    // Needs email confirmation
    if (['confirm your email','enter the code','check your email','we sent a code',
         'enter the confirmation','confirm your registration'].some(x => text.includes(x)))
      return { needsConfirm: true, raw };

    // FB security checkpoint
    if (finalUrl.includes('checkpoint') || text.includes('security check'))
      return { failed: true, reason: "FB security checkpoint (IP flagged)", raw };

    // Email already registered
    if (['already registered','already have an account'].some(x => text.includes(x)))
      return { failed: true, reason: "Email already registered", raw };

    // Got an error page (FB processed but rejected — likely bot/IP detection)
    if (r.status === 200 && raw.includes('<title>Error'))
      return { failed: true, reason: "FB rejected registration (bot/IP detection). Try later.", raw };

    // Unknown — return whatever we got
    return {
      failed: true,
      reason: `Unknown result (status ${r.status}, url: ${finalUrl.slice(0,60)})`,
      raw,
    };
  }

  return { failed: true, reason: "All submit URLs failed", raw: "" };
}

module.exports = {
  config: {
    name: "fbcreate",
    version: "2.2",
    author: "Siegfried Samá",
    countDown: 30,
    role: 2,
    description: { en: "Create Facebook accounts using temp email (admin only)" },
    category: "admin",
    guide: { en: "{pn} [amount] — gumawa ng 1-5 FB accounts" },
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID } = event;

    const amount = Math.min(parseInt(args[0]) || 1, 5);
    if (isNaN(amount) || amount < 1)
      return message.reply("❌ Halimbawa: !fbcreate 2  (max 5 per command)");

    await message.reply(
      `🔄 HYPER FBGEN v2.2\n━━━━━━━━━━━━━━━━━━━━━\nGagawa ng ${amount} account${amount > 1 ? 's' : ''}...`
    );

    let success = 0, failed = 0;
    const results = [];

    for (let i = 0; i < amount; i++) {
      const num = String(i + 1).padStart(2, '0');
      const [first, last]  = randName();
      const pass            = randPass();
      const { year, month, day } = randBirthday();
      const full = `${first} ${last}`;

      let email;
      try {
        email = await getTempMail();
      } catch (e) {
        failed++;
        results.push(`[${num}] ✗ Temp mail error: ${e.message.slice(0,60)}`);
        continue;
      }

      let result;
      try {
        result = await registerFB(first, last, email, pass, year, month, day);
      } catch (e) {
        failed++;
        results.push(`[${num}] ✗ Error: ${e.message.slice(0,80)}`);
        continue;
      }

      if (result.uid) {
        success++;
        results.push(
          `[${num}] ✅ CREATED\n` +
          `👤 ${full}\n` +
          `📧 ${email}\n` +
          `🔑 ${pass}\n` +
          `🎂 ${month}/${day}/${year}` +
          (result.uid !== 'registered' ? `\n🆔 UID: ${result.uid}` : '')
        );
      } else if (result.needsConfirm) {
        await message.reply(`[${num}] ⏳ ${full} — checking inbox for OTP...\n📧 ${email}`);
        const otp = await getInbox(email);
        if (otp) {
          success++;
          results.push(
            `[${num}] ⚠️ NEEDS OTP\n` +
            `👤 ${full}\n📧 ${email}\n🔑 ${pass}\n🎂 ${month}/${day}/${year}\n` +
            `📨 OTP: ${otp}\n💡 I-confirm sa email then login`
          );
        } else {
          success++;
          results.push(
            `[${num}] ⚠️ NEEDS CONFIRM (OTP not received)\n` +
            `👤 ${full}\n📧 ${email}\n🔑 ${pass}\n🎂 ${month}/${day}/${year}\n` +
            `💡 Check inbox manually: ${email}`
          );
        }
      } else {
        failed++;
        results.push(
          `[${num}] ✗ FAILED\n` +
          `👤 ${full}\n📧 ${email}\n` +
          `💥 ${result.reason || 'Unknown error'}`
        );
      }

      if (i < amount - 1) await sleep(2500);
    }

    const divider = '━━━━━━━━━━━━━━━━━━━━━';
    const body    = results.join(`\n${divider}\n`);
    const summary = `${divider}\n📊 TAPOS NA:\n✅ Success: ${success}\n✗  Failed:  ${failed}\n📌 Total:   ${amount}`;

    await message.reply(`${divider}\n${body}\n${summary}`);
  }
};
