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
const REG_URLS = [
  "https://m.facebook.com/r.php",
  "https://m.facebook.com/reg/",
  "https://mobile.facebook.com/r.php",
];
const SUBMIT_URLS = [
  "https://m.facebook.com/reg/submit/",
  "https://m.facebook.com/r.php",
  "https://mobile.facebook.com/reg/submit/",
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
function mergeCookies(a, b) { return { ...a, ...b }; }
function cookieStr(jar)     { return Object.entries(jar).map(([k,v]) => `${k}=${v}`).join('; '); }

function extractTokens(html) {
  const tokens = {};
  for (const inp of (html.match(/<input[^>]+>/gi) || [])) {
    if (!/hidden/i.test(inp)) continue;
    const nm = inp.match(/name=["']([^"']+)["']/);
    const vl = inp.match(/value=["']([^"']*)["']/);
    if (nm) tokens[nm[1]] = vl ? vl[1] : "";
  }
  for (const key of ['fb_dtsg','jazoest','lsd','reg_instance','client_id','datr']) {
    if (!tokens[key]) {
      const m = html.match(new RegExp(`"${key}"\\s*[,:]?\\s*"([^"]+)"`));
      if (m) tokens[key] = m[1];
    }
  }
  return tokens;
}

async function getTempMail() {
  const r = await axios.get(TEMPMAIL_GEN, { timeout: 15000 });
  const email = r.data?.email || r.data?.data?.email || r.data?.mail;
  if (!email) throw new Error(`No email: ${JSON.stringify(r.data).slice(0,100)}`);
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
  const baseHeaders = {
    "User-Agent":                ua,
    "Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language":           "en-US,en;q=0.9",
    "Accept-Encoding":           "gzip, deflate, br",
    "Connection":                "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  let jar = {};

  try {
    const warmup = await axios.get("https://m.facebook.com/", {
      headers: baseHeaders, timeout: 15000, maxRedirects: 5,
    });
    jar = parseCookies(warmup.headers['set-cookie']);
    await sleep(Math.random() * 700 + 600);
  } catch (e) {}

  let tokens = {};
  let html   = "";

  for (const url of REG_URLS) {
    try {
      const r = await axios.get(url, {
        headers: { ...baseHeaders, Cookie: cookieStr(jar) },
        timeout: 25000,
        maxRedirects: 5,
      });
      if (r.status === 200 && r.data && r.data.length > 200) {
        html   = r.data;
        jar    = mergeCookies(jar, parseCookies(r.headers['set-cookie']));
        tokens = extractTokens(html);
        break;
      }
    } catch (e) {}
  }

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
    ...tokens,
  };

  const formBody = new URLSearchParams(formObj).toString();
  const postHeaders = {
    ...baseHeaders,
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer":      "https://m.facebook.com/r.php",
    "Origin":       "https://m.facebook.com",
    "Cookie":       cookieStr(jar),
  };

  for (const url of SUBMIT_URLS) {
    try {
      const r = await axios.post(url, formBody, {
        headers: postHeaders,
        timeout: 20000,
        maxRedirects: 5,
      });

      const postJar = parseCookies(r.headers['set-cookie']);
      const cUser   = postJar['c_user'] || "";
      const raw     = typeof r.data === 'string' ? r.data.slice(0, 500) : JSON.stringify(r.data).slice(0, 500);
      const text    = typeof r.data === 'string' ? r.data.toLowerCase() : '';
      const finalUrl = r.request?.res?.responseUrl || r.config?.url || '';

      if (cUser) return { uid: cUser, raw };
      if (['home.php','/feed','welcome'].some(x => finalUrl.includes(x))) return { uid: 'registered', raw };
      if (['confirm your email','enter the code','check your email','we sent','verification code'].some(x => text.includes(x)))
        return { needsConfirm: true, raw };
      if (['already registered','already have an account'].some(x => text.includes(x)))
        return { failed: true, reason: 'Email already registered', raw };

      return { failed: true, reason: `No uid/confirm signal (url: ${finalUrl.slice(0,60)})`, raw };
    } catch (e) {
      continue;
    }
  }
  return { failed: true, reason: 'All submit URLs failed', raw: '' };
}

module.exports = {
  config: {
    name: "fbcreate",
    version: "2.1",
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

    await message.reply(`🔄 HYPER FBGEN — Gagawa ng ${amount} account${amount > 1 ? 's' : ''}...\n━━━━━━━━━━━━━━━━━━━━━`);

    let success = 0, failed = 0;
    const results = [];

    for (let i = 0; i < amount; i++) {
      const num = String(i + 1).padStart(2, '0');
      const [first, last] = randName();
      const pass = randPass();
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
        results.push(`[${num}] ✗ Register error: ${e.message.slice(0,60)}`);
        continue;
      }

      if (result.uid) {
        success++;
        results.push(
          `[${num}] ✅ CREATED\n` +
          `👤 ${full}\n` +
          `📧 ${email}\n` +
          `🔑 ${pass}\n` +
          `🎂 ${month}/${day}/${year}\n` +
          (result.uid !== 'registered' ? `🆔 UID: ${result.uid}` : `💡 Registered (check cookies)`)
        );
      } else if (result.needsConfirm) {
        await message.reply(`[${num}] ⏳ ${full} — naghihintay ng OTP sa inbox...\n📧 ${email}`);
        const otp = await getInbox(email);
        success++;
        if (otp) {
          results.push(
            `[${num}] ⚠️ NEEDS OTP\n` +
            `👤 ${full}\n` +
            `📧 ${email}\n` +
            `🔑 ${pass}\n` +
            `🎂 ${month}/${day}/${year}\n` +
            `📨 OTP: ${otp}\n` +
            `💡 I-confirm sa email then login`
          );
        } else {
          results.push(
            `[${num}] ⚠️ NEEDS CONFIRM (OTP hindi natanggap)\n` +
            `👤 ${full}\n` +
            `📧 ${email}\n` +
            `🔑 ${pass}\n` +
            `🎂 ${month}/${day}/${year}\n` +
            `💡 Check inbox manually: ${email}`
          );
        }
      } else {
        failed++;
        results.push(`[${num}] ✗ FAILED — ${full}\n📧 ${email}\n💥 ${result.reason || 'Unknown'}`);
      }

      if (i < amount - 1) await sleep(2500);
    }

    const divider = '━━━━━━━━━━━━━━━━━━━━━';
    const body = results.join(`\n${divider}\n`);
    const summary = `${divider}\n📊 TAPOS NA:\n✅ Success: ${success}\n✗  Failed:  ${failed}\n📌 Total:   ${amount}`;

    await message.reply(`${divider}\n${body}\n${summary}`);
  }
};
