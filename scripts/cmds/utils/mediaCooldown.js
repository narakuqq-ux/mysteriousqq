if (!global.mediaCooldown) global.mediaCooldown = new Map();

const COOLDOWN_MS = 5000;

module.exports = async function checkMediaCooldown(commandName, senderID, api, threadID) {
  if (!global.mediaCooldown) global.mediaCooldown = new Map();

  const key = `${senderID}_${commandName}`;
  const now = Date.now();
  const last = global.mediaCooldown.get(key) || 0;
  const elapsed = now - last;

  if (elapsed < COOLDOWN_MS) {
    let remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);

    const sendMsg = (text) => new Promise(resolve =>
      api.sendMessage(text, threadID, (err, info) => resolve(info))
    );

    let currentMsg = await sendMsg(
      `⏳ please wait ${remaining} second${remaining !== 1 ? "s" : ""} before using this command to avoid overloaded`
    );

    const timer = setInterval(async () => {
      remaining--;
      try { if (currentMsg?.messageID) api.unsendMessage(currentMsg.messageID); } catch {}
      if (remaining > 0) {
        currentMsg = await sendMsg(
          `⏳ please wait ${remaining} second${remaining !== 1 ? "s" : ""} before using this command to avoid overloaded`
        );
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return false;
  }

  global.mediaCooldown.set(key, now);
  return true;
};
