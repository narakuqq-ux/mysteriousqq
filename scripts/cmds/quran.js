const axios = require("axios");

const surahMap = {
  1: ["fatiha", "ফাতিহা"],
  2: ["baqarah", "বাকারাহ"],
  3: ["imran", "ইমরান"],
  4: ["nisa", "নিসা"],
  5: ["maidah", "মায়েদাহ"],
  6: ["anam", "আনআম"],
  7: ["araf", "আরাফ"],
  8: ["anfal", "আনফাল"],
  9: ["taubah", "তাওবাহ"],
  10: ["yunus", "ইউনুস"],
  11: ["hud", "হুদ"],
  12: ["yusuf", "ইউসুফ"],
  13: ["raad", "রাদ"],
  14: ["ibrahim", "ইব্রাহিম"],
  15: ["hijr", "হিজর"],
  16: ["nahl", "নাহল"],
  17: ["isra", "ইসরা"],
  18: ["kahf", "কাহফ"],
  19: ["maryam", "মারইয়াম"],
  20: ["taha", "ত্বা-হা"],
  21: ["anbiya", "আম্বিয়া"],
  22: ["hajj", "হজ"],
  23: ["muminoon", "মুমিনুন"],
  24: ["nur", "নূর"],
  25: ["furqan", "ফুরকান"],
  26: ["shuara", "শুআরা"],
  27: ["naml", "নামল"],
  28: ["qasas", "কাসাস"],
  29: ["ankabut", "আনকাবুত"],
  30: ["rum", "রূম"],
  31: ["luqman", "লোকমান"],
  32: ["sajda", "সাজদা"],
  33: ["ahzab", "আহজাব"],
  34: ["saba", "সাবা"],
  35: ["fatir", "ফাতির"],
  36: ["yasin", "ইয়াসিন"],
  37: ["saffat", "সাফফাত"],
  38: ["sad", "সা’দ"],
  39: ["zumar", "যুমার"],
  40: ["ghafir", "গাফির"],
  41: ["fussilat", "ফুসসিলাত"],
  42: ["shura", "শূরা"],
  43: ["zukhruf", "যুখরুফ"],
  44: ["dukhan", "দুখান"],
  45: ["jasiyah", "জাসিয়া"],
  46: ["ahqaf", "আহকাফ"],
  47: ["muhammad", "মুহাম্মাদ"],
  48: ["fath", "ফাতহ"],
  49: ["hujurat", "হুজুরাত"],
  50: ["qaf", "ক্বাফ"],
  51: ["dhariyat", "যারিয়াত"],
  52: ["tur", "ত্বূর"],
  53: ["najm", "নাজম"],
  54: ["qamar", "কামার"],
  55: ["rahman", "রহমান"],
  56: ["waqiah", "ওয়াকিয়া"],
  57: ["hadid", "হাদীদ"],
  58: ["mujadila", "মুজাদিলা"],
  59: ["hashr", "হাশর"],
  60: ["mumtahanah", "মুমতাহিনা"],
  61: ["saff", "সাফ"],
  62: ["jumuah", "জুমু’আ"],
  63: ["munafiqun", "মুনাফিকুন"],
  64: ["taghabun", "তাগাবুন"],
  65: ["talaq", "তালাক"],
  66: ["tahrim", "তাহরীম"],
  67: ["mulk", "মুলক"],
  68: ["qalam", "কলম"],
  69: ["haqqah", "হাক্বক্বাহ"],
  70: ["ma'arij", "মাআরিজ"],
  71: ["nuh", "নূহ"],
  72: ["jinn", "জ্বিন"],
  73: ["muzzammil", "মুযাম্মিল"],
  74: ["muddaththir", "মুদ্দাসসির"],
  75: ["qiyamah", "কিয়ামাহ"],
  76: ["insan", "ইনসান"],
  77: ["mursalat", "মুরসালাত"],
  78: ["naba", "নাবা’"],
  79: ["naziyat", "নাযিয়াত"],
  80: ["abasa", "আবাসা"],
  81: ["takwir", "তাকভির"],
  82: ["infitar", "ইনফিতার"],
  83: ["mutaffifin", "মুতাফফিফিন"],
  84: ["inshiqaq", "ইনশিক্বাক"],
  85: ["buruj", "বুরুজ"],
  86: ["tariq", "তারিক"],
  87: ["ala", "আ'লা"],
  88: ["ghashiyah", "গাশিয়াহ"],
  89: ["fajr", "ফজর"],
  90: ["balad", "বালাদ"],
  91: ["shams", "শামস"],
  92: ["layl", "লাইল"],
  93: ["duha", "দুহা"],
  94: ["sharh", "আল ইনশিরাহ"],
  95: ["tin", "তীন"],
  96: ["alaq", "আলাক"],
  97: ["qadr", "কদর"],
  98: ["bayyinah", "বাইয়্যিনাহ"],
  99: ["zilzal", "যিলযাল"],
  100: ["adiyat", "আদিয়াত"],
  101: ["qari'ah", "কারিয়াহ"],
  102: ["takathur", "তাকাসুর"],
  103: ["asr", "আসর"],
  104: ["humazah", "হুমাযাহ"],
  105: ["fil", "ফীল"],
  106: ["quraish", "কুরাইশ"],
  107: ["maun", "মাউন"],
  108: ["kawthar", "কাওসার"],
  109: ["kafirun", "কাফিরুন"],
  110: ["nasr", "নাসর"],
  111: ["masad", "লাহাব"],
  112: ["ikhlas", "ইখলাস"],
  113: ["falaq", "ফালাক"],
  114: ["nas", "নাস"]
  // 🛑 বাকিগুলো চাইলে এখানে যুক্ত করো
};

const driveAudioIds = {
  1: "1QVxonQa7JBcBbuQQHWySwsp4wJpvDonG",
  3: "1QgawsTyDvdrrcDbtD57X13CKCIievFAD",
  112: "1hz3dKc3gyRSHkTz78VnEr-wkM7vCOTW2",
  114: "1rsm7ZmOnqSlUDHhZtFSBL6LM9uREnIdv"
  // 🛑 এখানেও Drive ID যোগ করো
};

function getSurahNumber(input) {
  input = input.toLowerCase();
  if (!isNaN(input)) return parseInt(input);
  for (const [num, names] of Object.entries(surahMap)) {
    if (names.some(n => n.toLowerCase() === input)) return parseInt(num);
  }
  return null;
}

module.exports = {
  config: {
    name: "quran",
    version: "3.0",
    author: "ChatGPT + You",
    role: 0,
    shortDescription: "📖 কুরআন পড়ুন ও শুনুন (অডিও সহ)",
    category: "islam",
    guide: {
      en: "/quran list\n/quran [name|number]\n/quran [name|number] audio"
    }
  },

  onStart: async function ({ api, args, message, event }) {
    if (!args[0]) {
      return message.reply("🕌 উদাহরণ:\n/quran list\n/quran ফাতিহা\n/quran 112\n/quran 1 audio");
    }

    const input = args[0].toLowerCase();
    const type = args[1]?.toLowerCase();

    // 📘 সূরা তালিকা
    if (input === "list") {
      let listText = "📖 ১১৪ সূরা:\n\n";
      for (let i = 1; i <= 114; i++) {
        if (surahMap[i]) {
          listText += `${i}. ${surahMap[i][0]} (${surahMap[i][1]})\n`;
        }
      }
      return message.reply(listText);
    }

    // ⛓️ সূরা নাম্বার বের করো
    const surahNum = getSurahNumber(input);
    if (!surahNum || surahNum < 1 || surahNum > 114) {
      return message.reply("❌ সঠিক সূরা নাম বা নম্বর দিন (1-114)।");
    }

    // 🔊 অডিও
    if (type === "audio") {
      const fileId = driveAudioIds[surahNum];
      if (!fileId) return message.reply("❌ এই সূরার অডিও এখনো যুক্ত হয়নি।");

      const audioUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
      try {
        return api.sendMessage({
          body: `🔊 সূরা ${surahMap[surahNum]?.[0] || "no-name"} (${surahMap[surahNum]?.[1] || ""}) অডিও`,
          attachment: await global.utils.getStreamFromURL(audioUrl)
        }, event.threadID, event.messageID);
      } catch (e) {
        console.error("Audio error:", e.message);
        return message.reply("❌ অডিও পাঠাতে সমস্যা হয়েছে।");
      }
    }

    // 📖 সূরা পাঠ্য
    try {
      const [arRes, bnRes] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/ar.alafasy`),
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/bn.bengali`)
      ]);

      const ar = arRes.data.data;
      const bn = bnRes.data.data;

      let msg = `📖 সূরা ${ar.englishName} (${ar.name})\n\n`;

      for (let i = 0; i < ar.ayahs.length; i++) {
        msg += `${i + 1}. 🕋 ${ar.ayahs[i].text}\n🇧🇩 ${bn.ayahs[i].text}\n\n`;
        if (msg.length > 1800) {
          await message.reply(msg);
          msg = "";
        }
      }

      if (msg) return message.reply(msg);
    } catch (err) {
      console.error("Surah fetch error:", err.message);
      return message.reply("❌ কিছু সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।");
    }
  }
};