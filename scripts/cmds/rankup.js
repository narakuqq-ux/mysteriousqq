const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const deltaNext = global.GoatBot.configCommands.envCommands.rank.deltaNext;
const expToLevel = exp => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);

const CACHE_DIR = path.join(__dirname, "cache", "rankup");

async function getRankupGif(uid) {
        await fs.ensureDir(CACHE_DIR);
        const gifPath = path.join(CACHE_DIR, `rankup_${uid}.gif`);
        const url = `https://rankup-api-b1rv.vercel.app/api/rankup?uid=${uid}`;
        try {
                const res = await axios.get(url, {
                        responseType: "arraybuffer",
                        timeout: 15000,
                        headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                        }
                });
                await fs.writeFile(gifPath, Buffer.from(res.data));
                return gifPath;
        } catch (err) {
                return null;
        }
}

module.exports = {
        config: {
                name: "rankup",
                version: "2.0",
                author: "NTKhang | modified by Siegfried",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Bật/tắt thông báo level up",
                        en: "Turn on/off level up notification"
                },
                category: "rank",
                guide: {
                        en: "{pn} [on | off]"
                },
                envConfig: {
                        deltaNext: 5
                }
        },

        langs: {
                vi: {
                        syntaxError: "Sai cú pháp, chỉ có thể dùng {pn} on hoặc {pn} off",
                        turnedOn: "Đã bật thông báo level up",
                        turnedOff: "Đã tắt thông báo level up",
                        notiMessage: "🎉🎉 chúc mừng bạn đạt level %1"
                },
                en: {
                        syntaxError: "Syntax error, only use {pn} on or {pn} off",
                        turnedOn: "Turned on level up notification",
                        turnedOff: "Turned off level up notification",
                        notiMessage: "🎉🎉 Congratulations on reaching level %1"
                }
        },

        onStart: async function ({ message, event, threadsData, args, getLang }) {
                if (!["on", "off"].includes(args[0]))
                        return message.reply(getLang("syntaxError"));
                await threadsData.set(event.threadID, args[0] == "on", "settings.sendRankupMessage");
                return message.reply(args[0] == "on" ? getLang("turnedOn") : getLang("turnedOff"));
        },

        onChat: async function ({ threadsData, usersData, event, message, getLang }) {
                const threadData = await threadsData.get(event.threadID);
                const sendRankupMessage = threadData.settings.sendRankupMessage;
                if (sendRankupMessage === false) return;

                const { exp } = await usersData.get(event.senderID);
                const currentLevel = expToLevel(exp);
                if (currentLevel <= expToLevel(exp - 1)) return;

                const userData = await usersData.get(event.senderID);
                let customMessage = await threadsData.get(event.threadID, "data.rankup.message");
                let isTag = false;
                const formMessage = {};

                if (customMessage) {
                        customMessage = customMessage
                                .replace(/{oldRank}/g, currentLevel - 1)
                                .replace(/{currentRank}/g, currentLevel);
                        if (customMessage.includes("{userNameTag}")) {
                                isTag = true;
                                customMessage = customMessage.replace(/{userNameTag}/g, `@${userData.name}`);
                        } else {
                                customMessage = customMessage.replace(/{userName}/g, userData.name);
                        }
                        formMessage.body = customMessage;
                } else {
                        formMessage.body = getLang("notiMessage", currentLevel);
                }

                if (isTag) {
                        formMessage.mentions = [{
                                tag: `@${userData.name}`,
                                id: event.senderID
                        }];
                }

                const gifPath = await getRankupGif(event.senderID);
                if (gifPath) {
                        formMessage.attachment = fs.createReadStream(gifPath);
                        message.reply(formMessage, () => {
                                fs.unlink(gifPath).catch(() => {});
                        });
                } else {
                        message.reply(formMessage);
                }
        }
};
