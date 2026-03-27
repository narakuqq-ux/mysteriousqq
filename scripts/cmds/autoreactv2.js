module.exports = {
  config: {
    name: "autoreactv2",
    version: "1.0.2",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    description: {
      en: "Auto-react to messages based on keywords (v2 - startsWith detection)"
    },
    category: "events",
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { messageID } = event;
    if (!event.body) return;

    const body = event.body;
    const starts = (kw) => body.toLowerCase().startsWith(kw.toLowerCase());

    const setReact = (emoji) => {
      api.setMessageReaction(emoji, messageID, (err) => {
        if (err) console.error(`[autoreactv2] Failed to set reaction: ${err}`);
      }, true);
    };

    // ❤️ Greetings / Wholesome
    if (
      ["kain","yie","hehe","mwah","mwuah","baby","bby","babe","bebe",
      "good","afternoon","aftie","morning","eve","dali na","we",
      "lalaki","buti pa"].some(k => starts(k))
      || ["😋","🤩","🙄","🤓","☕","🤗","🤭","😶","🥵","😎","🤡","😇","😊","😏","😻","❤️"].some(emoji => body.startsWith(emoji))
    ) {
      return setReact("❤️");
    }

    // 😍 Love / Kilig
    if (
      ["love","i love","ilove","ilab","lalabs","mahal",
      "shet","kantot","kantutan","kantotan","iyutan","iyotan","bold","porn",
      "pekpek","pepe","fuck","ugh","iniyot","eut","eutan","jakol","jakul",
      "salsal","fingerin"].some(k => starts(k))
      || ["😙","😘","😗","😍","🥰","😻"].some(emoji => body.startsWith(emoji))
    ) {
      return setReact("😍");
    }

    // 😢 Sad / Stress
    if (
      ["sad","malungkot","umay","ayaw ko na","gusto ko ng mamatay","stress",
      "gusto ko nang mamatay","mamatay na lang ako","bwesit talaga","hay",
      "bwesit na yan","putanginang yan","hayop na yan","piste na yan",
      "tarantado na yan","piste talaga","arghh","pota!","puta!","gago!",
      "mamatay na lahat ng mga","sana namatay","nakakalungkot",
      "sakit","ifeel","i feel","hindi na ako","nakakainggit","nandi","nangdi"].some(k => starts(k))
      || ["😞","😨","😥","😭","😓","😢","😕","😑","😩","😰","😟","😦"].some(emoji => body.startsWith(emoji))
    ) {
      return setReact("😢");
    }

    // 😆 Funny / Bastos
    if (
      ["bobo","gago","suntukan","kantutin","hayop","hayup","hindot","tangina",
      "tang ina","bwesit","piste","argh","pota","puta","fuckyou","pakyu","pakyo",
      "may bold","bold ni","may bold si","send bold","kingina","king ina",
      "hahaha","baliw","bubu","mabaho","manyakis","manyakol","ambobo",
      "walang utak","bts","deputa","amp","tanga","bastos","punyeta"].some(k => starts(k))
      || ["😆","😂","🤣"].some(emoji => body.startsWith(emoji))
    ) {
      return setReact("😆");
    }
  }
};
