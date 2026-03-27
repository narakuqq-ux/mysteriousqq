module.exports = {
  config: {
    name: "goiadmin",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 0,
    role: 0,
    description: {
      en: "Automatically responds when admin is tagged or name is mentioned"
    },
    category: "events",
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, mentions } = event;
    if (!body && (!mentions || Object.keys(mentions).length === 0)) return;

    const adminIDs = global.GoatBot?.config?.adminBot || [];

    const tagReplies = [
      "Don't tag my admin he's busy😗",
      "Uy bakit mo tine-tag si admin? Busy siya wag mong abalahin!😤",
      "My admin is unavailable right now, please try again later😴",
      "Huy! Bawal mag-tag ng admin! Natutulog siya😴💤",
      "Admin is currently AFK, please leave a message after the beep... *beep*📵",
      "Shh! My admin needs peace and quiet right now🤫",
      "Omg stop tagging admin!! He has feelings too you know😭",
      "Error 404: Admin not available for tagging😂",
      "Bawal yan! Admin is on DND mode right now🚫",
      "My admin said: 'Sino nanaman yan?!' 😂 so please don't tag him!"
    ];

    const nameReplies = [
      "My admin is coding right now don't disturb him😠",
      "Shhh! Si Siegfried ay busy mag-code ngayon, wag mong guluhin!💻",
      "Siegfried is currently debugging, please don't add to his bugs😅",
      "Admin Sieg is in the zone right now 🔥 don't break his focus!",
      "Uy nabanggit mo si Sieg ah! He said he's too busy for you right now😏",
      "Siegfried is currently building something amazing, bother him later😤",
      "Si Sieg ay naghihintay ng response sa StackOverflow, wag muna siyang abalahin😂",
      "My admin Siegfried has entered focus mode 🎯 come back later!",
      "Siegfried? Oh he's probably fixing bugs that shouldn't even exist😩",
      "Admin Sieg is alive but mentally in another dimension (coding) 🧠💻"
    ];

    const taggedAdminIDs = Object.keys(mentions || {});
    const isAdminTagged = taggedAdminIDs.some(id => adminIDs.includes(id));

    const lowerBody = (body || "").toLowerCase();
    const isNameMentioned = ["sieg", "siegfried"].some(k => lowerBody.includes(k));

    if (isAdminTagged) {
      const reply = tagReplies[Math.floor(Math.random() * tagReplies.length)];
      return api.sendMessage(reply, threadID, messageID);
    }

    if (isNameMentioned) {
      const reply = nameReplies[Math.floor(Math.random() * nameReplies.length)];
      return api.sendMessage(reply, threadID, messageID);
    }
  }
};
