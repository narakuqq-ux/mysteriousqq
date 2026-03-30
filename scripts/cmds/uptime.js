const os = require("os");

function byte2mb(bytes) {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

async function getCpuPercent() {
  return new Promise((resolve) => {
    const start = process.cpuUsage();
    const startTime = process.hrtime.bigint();
    setTimeout(() => {
      const usage = process.cpuUsage(start);
      const elapsed = Number(process.hrtime.bigint() - startTime) / 1e3;
      const totalCpu = (usage.user + usage.system) / elapsed * 100;
      resolve(Math.min(100, totalCpu).toFixed(1));
    }, 200);
  });
}

module.exports = {
  config: {
    name: "uptime",
    version: "2.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 2,
    description: {
      en: "Show bot uptime, system stats, and user/thread counts (admin only)"
    },
    category: "admin",
    guide: {
      en: "{pn}"
    }
  },

  langs: {
    en: {
      result: [
        "⏱️ 𝗨𝗽𝘁𝗶𝗺𝗲: %1h %2m %3s",
        "👥 𝗨𝘀𝗲𝗿𝘀: %4",
        "💬 𝗧𝗵𝗿𝗲𝗮𝗱𝘀: %5",
        "🖥️ 𝗖𝗣𝗨: %6%",
        "💾 𝗥𝗔𝗠: %7 / %8",
        "📡 𝗣𝗶𝗻𝗴: %9ms"
      ].join("\n")
    }
  },

  onStart: async function ({ api, event, message, usersData, threadsData, getLang }) {
    const time = process.uptime();
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    const [allUsers, allThreads, cpuPercent] = await Promise.all([
      usersData.getAll().catch(() => []),
      threadsData.getAll().catch(() => []),
      getCpuPercent()
    ]);

    const mem = process.memoryUsage();
    const totalRam = byte2mb(os.totalmem());
    const usedRam = byte2mb(mem.rss);

    const pingStart = Date.now();
    await api.sendMessage("", event.threadID);
    const ping = Date.now() - pingStart;

    return message.reply(
      getLang("result",
        hours, minutes, seconds,
        allUsers.length,
        allThreads.length,
        cpuPercent,
        usedRam, totalRam,
        ping
      )
    );
  }
};
