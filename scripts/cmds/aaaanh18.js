const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const LINKS = [
"https://i.postimg.cc/wTJNSC1G/E-B9ea-WQAAst-Yg.jpg",
"https://i.postimg.cc/sgrWyTSD/E-B9eb-AWUAINyt-B.jpg",
"https://i.postimg.cc/TYcj48LJ/E02i-P-q-XIAE62tu.jpg",
"https://i.postimg.cc/MpK0ks12/E02i-P-w-WYAEbvgg.jpg",
"https://i.postimg.cc/k5LWbqzq/E02i-P-x-XIAAy-K2k.jpg",
"https://i.postimg.cc/C5R1Hqq2/E067-KUr-VIAYK-4-R.jpg",
"https://i.postimg.cc/v8KD80Rw/E067-KUs-Uc-AM2jri.jpg",
"https://i.postimg.cc/xCJD6y6L/E07-FXgt-UYAAp-Qn-S.jpg",
"https://i.postimg.cc/q77d3dnb/E07-FXgu-Uc-AQB1-RK.jpg",
"https://i.postimg.cc/pXPcTJKk/E08z-UBs-Xo-AMh-F2-F.jpg",
"https://i.postimg.cc/wBR0Pfdx/E08z-UBu-WUAMx-KL8.jpg",
"https://i.postimg.cc/3RWbK8ph/E0cw-VJp-Vo-AMw8g-C.jpg",
"https://i.postimg.cc/250KRb1T/E0cw-VJr-UYAAvdpk.jpg",
"https://i.postimg.cc/7LHWWMZf/E0iwcu-XUYAIk-OOs.jpg",
"https://i.postimg.cc/rwLbSL6G/E0iwcu-XVUAAEUC.jpg",
"https://i.postimg.cc/qRYDqPX3/E0-JLpim-XMAMNpcx.jpg",
"https://i.postimg.cc/kgFHsh90/E0-JLpio-XIAAg-Xm9.jpg",
"https://i.postimg.cc/44qjx9BS/E0-JOIXn-WYAQht-Ed.jpg",
"https://i.postimg.cc/MKBNMpLK/E0-JOIXq-Xo-AMY0w-F.jpg",
"https://i.postimg.cc/mZz6JrBN/E0rf0jh-XIAYVIHN.jpg",
"https://i.postimg.cc/ryBYkLp6/E0rf0jj-Xo-AMG-x-X.jpg",
"https://i.postimg.cc/y8PfcgyB/E0s-Ky-B-WYAESuzb.jpg",
"https://i.postimg.cc/J4jY7dys/E0s-Ky-B9-Xo-AAZBEM.jpg",
"https://i.postimg.cc/ZnsNJmrG/E11dmj-HVg-AIg-At-V.jpg",
"https://i.postimg.cc/DfxLrrtx/E11dmjl-UUAQs-Qhm.jpg",
"https://i.postimg.cc/Zq5wcbwN/E1-BXp7-MVo-Ag-Cp-I.jpg",
"https://i.postimg.cc/4NRw0b8s/E1-BXp7-OVg-AAZVMI.jpg",
"https://i.postimg.cc/mDcVvdf2/E1-Go-Jmx-UUAQ6-Cmu.jpg",
"https://i.postimg.cc/DfXB5YPx/E1-Go-Jmx-VEAEt-Pw-V.jpg",
"https://i.postimg.cc/65Vzx2SR/E1lf-Kh4-VEAMRmp-S.jpg",
"https://i.postimg.cc/D0L6Z8w9/E1lf-Kh6-VIAYBZdy.jpg",
"https://i.postimg.cc/HkB2VGTk/E1qu0k-LVEAcs-Dld.jpg",
"https://i.postimg.cc/zfvkhdfS/E1qu0k-MUc-AEJPwv.jpg",
"https://i.postimg.cc/zBRStVKy/E1-RCTm9-Xo-AEqbv8.jpg",
"https://i.postimg.cc/cCy7V0BX/E1-RCTn-AWQAIt-Bp-E.jpg",
"https://i.postimg.cc/QCQgDw6s/E1v-KZ7q-WQAAZP7h.jpg",
"https://i.postimg.cc/c1wBftdj/E1v-KZ7r-XMAUxu-Tm.jpg",
"https://i.postimg.cc/dtDd47Fw/E29-Siqm-WEAYUVQ1.jpg",
"https://i.postimg.cc/mgH9W0hn/E29-Siqm-Xo-Ak-P0ne.jpg",
"https://i.postimg.cc/rwn1qS9d/E2-Ex23-KXEAEsg-Y.jpg",
"https://i.postimg.cc/2514yVH0/E2-Ex23-TXIAE-sne.jpg",
"https://i.postimg.cc/NFcTdbQn/E2g-0ed-Xo-AET0yb.jpg",
"https://i.postimg.cc/KjDTwLz8/E2g-0ef-WYAAh3le.jpg",
"https://i.postimg.cc/zDCTymjY/E2-Wub-N1-WEAAZ6f-M.jpg",
"https://i.postimg.cc/L6mLfyCY/E2-Wub-N3-WQAMAq-E2.jpg",
"https://i.postimg.cc/CKnqY91t/E2zceu8-XIAUxxg-Z.jpg",
"https://i.postimg.cc/kgpb07nK/E2zcev-GXw-AE7a0d.jpg",
"https://i.postimg.cc/pTqhBv1m/E31j-E9f-XMAEh-GLW.jpg",
"https://i.postimg.cc/N0vHspHj/E31j-E9g-XIAQZ-VM.jpg"
];

module.exports = {
  config: {
    name: "anh18",
    version: "1.0.1",
    author: "Binee - Convert by Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Send NSFW image (costs 800$)" },
    category: "nsfw",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, message, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const CACHE_DIR = path.resolve(__dirname, "cache");
    const tmpFile = path.join(CACHE_DIR, `anh18_${senderID}.jpg`);

    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    try {
      let money = 0;
      if (Currencies) {
        const data = await Currencies.getData(senderID);
        money = data?.money || 0;
      }

      if (Currencies && money < 800) {
        return message.reply("kailangan mo ng 800$ para dito.");
      }

      if (Currencies) await Currencies.setData(senderID, { money: money - 800 });

      const link = LINKS[Math.floor(Math.random() * LINKS.length)];
      const res = await axios.get(link, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(tmpFile, Buffer.from(res.data));

      api.setMessageReaction("✅", messageID, () => {}, true);

      await new Promise((resolve) => {
        api.sendMessage(
          { body: "Costs: 800$", attachment: fs.createReadStream(tmpFile) },
          threadID,
          () => {
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            resolve();
          },
          messageID
        );
      });
    } catch (err) {
      try { fs.unlinkSync(tmpFile); } catch (e) {}
      return message.reply("may error, subukan ulit.");
    }
  }
};
