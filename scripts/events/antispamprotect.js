const savedThreadNames = new Map();
const savedThreadImages = new Map();

const NAME_ROASTS = [
  "Hoy [name]! Sino nagsabi sayo na pwede kang magpalit ng pangalan ng group? Alis! 🤡",
  "[name] AmpUta, kapal ng mukha mo magpalit ng pangalan ng group namin. Bye! 🥊",
  "Grabe [name], feeling admin ka ba? Hindi ka. Kick ka na! 😂",
  "[name] Bakit mo binago pangalan ng group? Wala kang karapatang gawin yan. Out! 🤢",
  "Huy [name]! Sino ka para magpalit ng pangalan ng group namin? Bobo ka talaga. 🤪",
  "[name] Alam mo bang may consequences ang ginawa mo? Eto na — KICK! 😹",
  "[name] Feeling boss ka ba? Wala kang dating dito. Alis na! 😀🖕",
  "[name] Tanga ka ba? Binago mo pangalan ng group. Sana natulog ka na lang. 🤣",
  "[name] Ikaw na magaling! Nagpalit ng group name... tapos KICKED! Haha bye! 🥊"
];

const IMAGE_ROASTS = [
  "Hoy [name]! Sino nagsabi sayo na pwede kang magpalit ng picture ng group? Bobo! 🤡",
  "[name] AmpUta, kapal ng mukha mo palitan yung group pic namin. KICK! 🥊",
  "Grabe [name], feeling artista ka ba? Ibinalik ko na picture, ikaw — KICKED! 😂",
  "[name] Anong akala mo sa sarili mo? Hindi mo pwedeng palitan yung group pic. Alis! 🤢",
  "Huy [name]! Wala kang pahintulot palitan ang picture ng group. Bye na! 🤪",
  "[name] Nice try — ibinalik ko na picture. Ikaw naman — KICKED! Haha! 😹",
  "[name] Feeling designer ka ba? Wala kang talent at wala ka dito. Alis! 😀🖕",
  "[name] Tanga, binago mo group picture. Ibinalik ko na. Ikaw? KICKED! 🤣",
  "[name] Hahaha nice try palitan picture! Ibinalik ko na — sayo KICKED ka! 🥊"
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function roastAndKick(api, threadID, userID, name, roastPool) {
  const rawRoast = getRandom(roastPool);
  const body = rawRoast.replace(/\[name\]/g, name);

  const mentions = [];
  let idx = 0;
  while ((idx = body.indexOf(name, idx)) !== -1) {
    mentions.push({ tag: name, id: userID, fromIndex: idx });
    idx += name.length;
  }

  await new Promise(resolve => api.sendMessage({ body, mentions }, threadID, resolve));
  await new Promise(resolve => setTimeout(resolve, 1500));
  await new Promise(resolve => api.removeUserFromGroup(userID, threadID, resolve));
}

module.exports = {
  config: {
    name: "antispamprotect",
    version: "1.0.0",
    author: "Siegfried Samá",
    category: "events"
  },

  onStart: async function ({ api, event, threadsData, usersData }) {
    const { logMessageType, logMessageData, threadID, author } = event;

    if (logMessageType !== "log:thread-name" && logMessageType !== "log:thread-image") return;

    const botID = String(api.getCurrentUserID());
    const authorID = String(author || "");
    if (!authorID || authorID === botID) return;

    try {
      const threadData = await threadsData.get(threadID);
      const adminIDs = (threadData.adminIDs || []).map(String);

      if (!adminIDs.includes(botID)) return;

      const name = (await usersData.getName(authorID)) || "User";

      if (logMessageType === "log:thread-name") {
        const oldName = savedThreadNames.get(threadID) || threadData.threadName || null;
        if (oldName) {
          try {
            await new Promise(resolve => api.setTitle(oldName, threadID, resolve));
          } catch {}
        }
        savedThreadNames.set(threadID, logMessageData.name || oldName || "Group Chat");
        await roastAndKick(api, threadID, authorID, name, NAME_ROASTS);
      }

      if (logMessageType === "log:thread-image") {
        const oldImg = savedThreadImages.get(threadID) || threadData.imageSrc || null;
        if (oldImg) {
          try {
            const stream = await global.utils.getStreamFromURL(oldImg);
            if (stream) await new Promise(resolve => api.changeGroupImage(stream, threadID, resolve));
          } catch {}
        }
        savedThreadImages.set(threadID, logMessageData.url || oldImg || null);
        await roastAndKick(api, threadID, authorID, name, IMAGE_ROASTS);
      }
    } catch (err) {
      console.error("[antispamprotect] Error:", err.message);
    }
  }
};
