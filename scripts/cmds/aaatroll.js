if (!global.GoatBot.trollSessions) global.GoatBot.trollSessions = new Map();
const trollSessions = global.GoatBot.trollSessions;

module.exports = {
  config: {
    name: "troll",
    version: "2.0.0",
    author: "Siegfried Samá",
    countDown: 10,
    role: 2,
    description: { en: "ginagamit sa mga tangang troller" },
    category: "fun",
    guide: { en: "{pn} @mention | {pn} tigil" }
  },

  onChat: async function ({ api, event, message }) {
    const { threadID, body, senderID } = event;
    if (!trollSessions.has(threadID)) return;

    const prefix = global.GoatBot.config.prefix;
    if (!body || !body.startsWith(prefix)) return;

    const lower = body.slice(prefix.length).trim().toLowerCase();
    if (lower === "troll tigil" || lower.startsWith("troll tigil")) return;

    message.reply("❌ May aktibong troll session ngayon.\nGamitin ang: " + prefix + "troll tigil para itigil.");
  },

  onStart: async function ({ api, event, usersData, message, args, role }) {
    const { threadID, mentions } = event;
    const prefix = global.GoatBot.config.prefix;

    if (args[0] && args[0].toLowerCase() === "tigil") {
      if (!trollSessions.has(threadID)) {
        return message.reply("Walang aktibong troll session sa thread na ito.");
      }
      const session = trollSessions.get(threadID);
      session.aborted = true;
      trollSessions.delete(threadID);
      return message.reply("✅ Troll session naitigil na.");
    }

    if (trollSessions.has(threadID)) {
      return message.reply("⚠️ May umaandar pang troll session dito. Gamitin: " + prefix + "troll tigil");
    }

    const mentionIDs = Object.keys(mentions || {});
    if (!mentionIDs.length) {
      return message.reply("tag mo yung i t-troll mo boss Siegfried Samá");
    }

    const targetID = mentionIDs[0];
    const name = await usersData.getName(targetID);

    const session = { aborted: false };
    trollSessions.set(threadID, session);

    const rawLines = [
      "Hoy [name] AsoKo😂😂🥊🥊",
      "Labas Ka AsoKo Tawag Ka Ng Amo Mo😂😂🥊🥊",
      "BoBo Kang Troller Ka🤪🤪",
      "Ginalit Mo NaNman Ako🤪🤪",
      "Lapag [name] Gagu🤪🤪",
      "Takot Ka Ba? [name]😂😂",
      "O Ayan Natahimik Ka Na🤪🤪",
      "Keyboard Warrior AmpUta😂😂🥊",
      "Sa Bahay Puro Higa Ka😂✌🏿",
      "Baka Asar Ka Na Dyan Asoko😂😂🥊",
      "Kala Mo Nakakatakot Ka🤪🤪",
      "Kahit Sino Matatawa Sayo AsoKo🤪🤪",
      "Sinubukan Mo Pa Talaga Ako Asuko🤪",
      "Sana Natulog Ka Na Lang🤪",
      "PukPukin Ko Ulo Mo E🤪",
      "Bobo Ka Ba Talaga [name] O Nagpapanggap Ka Lang🤪",
      "Kasi Patawa Ka🤪",
      "Kahit Mag aral Ka Pa Hindi Na Sapat🤪",
      "Baka Mag isip Ka Muna SaSusunod🤪",
      "Hoy ASoko🤪",
      "Chupa Mo TiTiko🤪",
      "Hahaha Kawawa Ka Naman🤪",
      "Feeling Mo Matalino Ka No🤪",
      "Sa Totoo Lang Nakakatawa Ka🤪",
      "Ikaw Lang Nag iisip Na May Dating Ka🤪",
      "BuBu [name] Chupa Mo TitiKo pls😹🥊",
      "[name] Aso Lang Kita Alam Moba?😀✌🏿",
      "Nakakahiya Ka Sa Sarili Mo😀✌🏿",
      "Ewan Ko Ba Sayo Haha😀✌🏿",
      "Asar Ka Na Ata AsuKo😀✌🏿",
      "Huy [name]😀✌🏿",
      "Bagal Mo Magreply Taba😀✌🏿",
      "Halata Ka Nang Asar Kana Taba😀✌🏿",
      "Anyare Sa Kamay Mo Taba May Cancer Bayan😀✌🏿",
      "Di Mo Na Kaya Ano😀✌🏿",
      "Sige Umalis Ka Na😀✌🏿",
      "Babalik Ka Rin Dyan Haha😀✌🏿",
      "Kasi Wala Kang Magawa Sa Buhay Mo😀✌🏿",
      "Sa Totoong Buhay Wala Kang Dating😹",
      "Sa Chat Ka Lang Matapang🤢",
      "Pagod Na Ako Sayo Pre🤢",
      "Hindi Ka Worth It I Troll🤢",
      "Panalo Ako Tapos Na🤢",
      "Ikaw Pa Mag admit nYan Asuko😀✌🏿",
      "Nahihiya Ka Na Ata E😀✌🏿",
      "Huy [name] Asuko😀✌🏿",
      "Aminin Mo Na😀✌🏿",
      "Alam Ko Na Yan😀✌🏿",
      "Baka Umiyak Ka Na Dyan😀✌🏿",
      "BiBilangan Kita [name]😀✌🏿",
      "1",
      "2",
      "3",
      "4",
      "5",
      "Puta Bagal Ng Taba Nato😀✌🏿",
      "Kawawa Naman Buhay Mo😀✌🏿",
      "Sana Okay Ka Pa Rin😀✌🏿",
      "Wag Ka Na Sumagot Baka Mas Mahiya Ka Pa😀✌🏿",
      "Takot Ka Na Noh?😀✌🏿",
      "Ayan Na Nga Eh😀✌🏿",
      "Talo Ka Na Taba Tanggapin Mo Na😀✌🏿",
      "Baka Nanginginig Ka Na Diyan😀✌🏿",
      "Halata Na TabaChoy😀✌🏿",
      "Kamay Mo Nanlalamig Na Ata😀✌🏿",
      "Baka Hindi Ka Na Makabasa Nito Nang Maayos😀✌🏿",
      "Kasi Nanginginig Ka Na😀✌🏿",
      "AkoPa Sinubukan Mo [name]😀✌🏿",
      "Di Ka Uubra Sakin Boi😀✌🏿",
      "Batukan Kita E😀✌🏿",
      "Pwede Naba Kitang Birahin😀✌🏿",
      "Tangina Bagal Magreply😀✌🏿",
      "Hey [name]😀✌🏿",
      "NakakaWalang Gana I Troll😀✌🏿",
      "Chupa Mu na Lang TiTiKo Para Naman May Pakinabang Ka😀✌🏿",
      "Kasi Wla Eh Buti Pa Yung Hayup Merong Pakinabang Kesa Sayo😀✌🏿",
      "Diba [name] Alam Moyan😀✌🏿",
      "Alam Mong Mas Mahalaga Pa Hayup Kesa Sayo😀✌🏿",
      "Kesa Ikaw Puro Cellphone At Kain Ka Lang😀✌🏿",
      "Tangina Tambay Yarn😀✌🏿",
      "Sa Mga Magulang Lang Umaasa Yung AsuKo😀✌🏿",
      "Lapag [name]😀✌🏿",
      "O Ayan Tahimik Ka Na Bigla😀✌🏿",
      "Takot Ka Na Ba Pre😀✌🏿",
      "Sige Aminin Mo Na Nanginginig Ka😀✌🏿",
      "Hahaha Halata Talaga😀✌🏿",
      "Baka Luha Na Yan Hindi Pawis😀✌🏿",
      "Tuminog Ka Pa Sakin Haha😀✌🏿",
      "Ngayon Nanginginig Ka Na Diyan(⁠ ⁠･ั⁠﹏⁠･ั⁠)",
      "Ano Nangyari Sa Tapang Mo Preಥ⁠_⁠ಥ",
      "Nasan Na Yung Dating Kang Mayabang (⁠〒⁠﹏⁠〒⁠)",
      "Huy [name] Achukoಥ⁠╭⁠╮⁠ಥ",
      "Nawala Na Bigla Haha(⁠´⁠;⁠︵⁠;⁠`⁠)",
      "Baka Kelangan Mo Na Ng Tubig(⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠_⁠_⁠_⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠-̩̩̩⁠)",
      "Para Makalma Ka Hahaha(⁠╯⁠︵⁠╰⁠,⁠)",
      "Wala Na Sukat Sakin Pre😹🥊",
      "Kasi Alam Mo Na Talo Ka😹🥊",
      "Haha Wag Ka Mag Alala Asuko😄",
      "Nandito Pa Rin Ako Kapag Bumalik Ka😀✌🏿",
      "Baka Kinakabahan Ka Na Sumagot😀✌🏿",
      "Kasi Baka Mas Malala Pa Ang Susunod✌🏿😀",
      "Tama Ka Dun AsuKo Mag ingat Ka😀✌🏿",
      "Mas Masarap Pa To Kapag Sumagot Ka Pa😀✌🏿",
      "Sige Subukan Mo Pa😀✌🏿",
      "Pero Alam Ko Ayaw Mo Na Haha😀✌🏿",
      "Diba [name]😀✌🏿",
      "Nanginginig Ka Na Kaya😀✌🏿",
      "Okay Lang Normal Lang Yan😀✌🏿",
      "Pag Natalo Ka Ganyan Talaga😀✌🏿",
      "Nanginginig Tatalon Tatalon😀✌🏿",
      "Hahaha Kawawa Ka Naman😀✌🏿",
      "Dikapa SumaSagot Nararamdam Kona Na NangingiNig Ka Dyan😀✌🏿",
      "Sige Huminga Ka Muna AsoKo😀✌🏿",
      "Bago Ka Sumagot Ulit Haha😀✌🏿",
      "Kasi Baka Hindi Mo Na Maisip Ng Maayos😀✌🏿",
      "Dahil Nanginginig Ka Pa Rin😀✌🏿",
      "Sabayan Moko [name]😀✌🏿",
      "Oh Ano Akolang Nag Eefort Dito😀✌🏿",
      "Tanginang Mataba Nato😀✌🏿",
      "Puro Nanga Higa Sa Bahay At Kain Pati Sa Chat Wlang Effort😀✌🏿",
      "Bubo Ka Pala [name]😀✌🏿",
      "D Mo Kaya Makipag Sabayan Sakin Noh?😀✌🏿",
      "Talo Ka Na Tanggapin Mo Na😀✌🏿",
      "NagSayang Pako Ng Oras Sayo🤪",
      "BoBo Ka Pala I Troll🤪",
      "Haha Baka Asar Ka Dyan🤪",
      "MagSabi Ka Lang🤪",
      "Video Call Nga Tayo Baka Umiiyak Kana🤪",
      "Iyakin Kapa Naman Eh🤪",
      "Oh Ano [name] Video Call Tayu🤪",
      "Dun Ko Titignan Tapang Mo🤪",
      "Wala Sa Keyboard Ang Tapang🤪",
      "Kasi Kamay MoLang Ginagalaw Mo🤪",
      "SuBukan Natin Sa RealLife BagaGin Ko Mukha Mo🤪🥊",
      "Dun Mo Ilabas Pagiging Tanga Mo [name]",
      "Pero Wag Nalang🤪",
      "Baka Bayot Ka🤪",
      "Baka Chupa Mopa TiTiKo Tas Bigla Kitang Napatay🤪",
      "Haha TangaKa🤪",
      "Kilalanin Mo Binabangga Mo Lol🤪",
      "NagSayang Pako Ng Oras Sayo🤪",
      "Bobo Ka Palang Bobita Ka🤪",
      "Ugaling Pantang🤪",
      "Bye Nanga🤪",
      "PagBalik Ko, Chupa Mo Titiko [name]🤪",
      "Para Peace Na Tayo😀✌🏿",
      "Mag Sorry Ka Sa Hari Ko Na Si Siegfried Samá😀✌🏿",
      "Para Sa Susunod Di Na Kita Itroll😀✌🏿",
      "Okay [name]?😀✌🏿",
      "Umayus Ka😀✌🏿",
      "Bye Nanga😀✌🏿",
      "🖕🏿"
    ];

    for (let i = 0; i < rawLines.length; i++) {
      if (session.aborted) break;

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (session.aborted) break;

      const raw = rawLines[i];

      if (raw.includes("[name]")) {
        const body = raw.replace(/\[name\]/g, name);
        const mentionList = [];
        let searchStart = 0;
        let idx;
        while ((idx = body.indexOf(name, searchStart)) !== -1) {
          mentionList.push({ tag: name, id: targetID, fromIndex: idx });
          searchStart = idx + name.length;
        }
        await new Promise(resolve => {
          api.sendMessage({ body, mentions: mentionList }, threadID, resolve);
        });
      } else {
        await new Promise(resolve => {
          api.sendMessage(raw, threadID, resolve);
        });
      }
    }

    if (trollSessions.get(threadID) === session) {
      trollSessions.delete(threadID);
    }
  }
};
