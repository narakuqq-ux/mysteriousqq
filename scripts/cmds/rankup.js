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
                author: "Siegfried Samá",
                countDown: 5,
                role: 0,
                description: {
                        en: "Sends a GIF when a user levels up (always on)"
                },
                category: "rank",
                envConfig: {
                        deltaNext: 5
                }
        },

        langs: {
                en: {
                        notiMessage: "🎉🎉 Congratulations on reaching level %1"
                },
                vi: {
                        notiMessage: "🎉🎉 chúc mừng bạn đạt level %1"
                }
        },

        onStart: async function () {},

        onChat: async function () {}
};
