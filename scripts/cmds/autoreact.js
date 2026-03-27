module.exports = {
  config: {
    name: "autoreact",
    version: "1.1.1",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    description: {
      en: "Bot auto-reacts to messages based on keywords"
    },
    category: "events",
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID } = event;
    if (!event.body) return;
    const react = event.body.toLowerCase();

    // 😆 Funny / Bastos keywords
    if (
      ["hahaha","haha","pakyu","bobo","gago","tangina","tang","pak","shit","amp","lol","ulol",
      "walang utak","tanga","bts","burat","kantutin","unggoy","bano","kulang","mabaho",
      "mapanghi","suntukan","stupid","fuck","fuckyou","sapak","bold","bisaya","gagi",
      "bastos","deputa","puta","pota","baboy","kababuyan","hayup","hayop","nigga",
      "script kiddie","trash","kagagohan","kagaguhan","kingina","hindot","jesus","jesos",
      "abno","lmao","xd","biot","bayot","bayut","bakla","bading","poor"].some(k => react.includes(k))
      || ["😆","😂",":)","🙂","😹","🤣","🖕","🤢","😝"].some(e => event.body.includes(e))
    ) {
      return api.setMessageReaction("😆", messageID, () => {}, true);
    }

    // 😍 Love / Kilig keywords
    if (
      ["mahal","love","lab","ilove","ilab","labyu","kiss","yie","kwass","krass","crush",
      "ligawan","kilig","kinikilig","ugh","sige pa","sarap","sex","porn","kantotan",
      "iyotan","iyutan","pasend","iyot","iyut","eut","shet","send","baby","babe","babi",
      "bby","kantot","manyak","libog","horn","malibog","labs","pekpek","pepe","puke",
      "bilat","puday","finger","fifinger","pipinger","pinger","mwah","mwuah","halikan",
      "halik","marry","abno"].some(k => react.includes(k))
      || ["😊","😗","😙","😘","😚","😍","🤭","🥰","😇","🤡","☺"].some(e => event.body.includes(e))
    ) {
      return api.setMessageReaction("😍", messageID, () => {}, true);
    }

    // 😢 Sad keywords
    if (
      ["sakit","saket","peyn","pain","mamatay","ayaw ko na","saktan","sasaktan","sad",
      "malungkot","depress","stress","depression","kalungkutan"].some(k => react.includes(k))
      || ["😥","😰","😨","😢",":(","😔","😞","😭"].some(e => event.body.includes(e))
    ) {
      return api.setMessageReaction("😢", messageID, () => {}, true);
    }

    // ❤ Greetings keywords
    if (
      ["eve","morning","afternoon","evening","eat","night","nyt"].some(k => react.includes(k))
    ) {
      return api.setMessageReaction("❤", messageID, () => {}, true);
    }
  }
};