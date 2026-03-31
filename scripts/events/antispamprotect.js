const savedThreadNames = new Map();

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
    version: "1.0.1",
    author: "Siegfried Samá",
    category: "events"
  },

  onStart: async function ({ api, event, threadsData, usersData }) {
    const { logMessageType, logMessageData, threadID, author } = event;

    if (logMessageType !== "log:thread-name") return;

    const botID = String(api.getCurrentUserID());
    const authorID = String(author || "");
    if (!authorID || authorID === botID) return;

    try {
      const threadData = await threadsData.get(threadID);
      const adminIDs = (threadData.adminIDs || []).map(String);
      if (!adminIDs.includes(botID)) return;

      const oldName = savedThreadNames.get(threadID) || threadData.threadName || null;
      if (oldName) {
        try {
          await new Promise(resolve => api.setTitle(oldName, threadID, resolve));
        } catch {}
      }
      savedThreadNames.set(threadID, logMessageData.name || oldName || "Group Chat");

      const name = (await usersData.getName(authorID)) || "User";
      await roastAndKick(api, threadID, authorID, name, NAME_ROASTS);
    } catch (err) {
      console.error("[antispamprotect] Error:", err.message);
    }
  }
};
