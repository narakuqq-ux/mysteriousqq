const { db, utils, GoatBot } = global;
const { config } = GoatBot;
const { log, getText } = utils;
const { creatingThreadData, creatingUserData } = global.client.database;

module.exports = async function (usersData, threadsData, event) {
        const { threadID } = event;
        const senderID = event.senderID || event.author || event.userID;

        // ———————————— CHECK THREAD DATA ———————————— //
        if (threadID) {
                try {
                        if (global.temp.createThreadDataError.includes(threadID))
                                return;

                        const findInCreatingThreadData = creatingThreadData.find(t => t.threadID == threadID);
                        if (!findInCreatingThreadData) {
                                if (global.db.allThreadData.some(t => t.threadID == threadID))
                                        return;

                                const threadData = await threadsData.create(threadID);
                                log.info("DATABASE", `New Thread: ${threadID} | ${threadData.threadName} | ${config.database.type}`);
                        }
                        else {
                                await findInCreatingThreadData.promise;
                        }
                }
                catch (err) {
                        if (err.name != "DATA_ALREADY_EXISTS") {
                                global.temp.createThreadDataError.push(threadID);
                                log.err("DATABASE", getText("handlerCheckData", "cantCreateThread", threadID), err);
                        }
                }
        }


        // ————————————— CHECK USER DATA ————————————— //
        if (senderID) {
                // Skip userID 0 (unreact events from Facebook API)
                if (senderID === 0 || senderID === '0') {
                        return;
                }
                
                try {
                        const findInCreatingUserData = creatingUserData.find(u => u.userID == senderID);
                        if (!findInCreatingUserData) {
                                if (db.allUserData.some(u => u.userID == senderID))
                                        return;

                                const userData = await usersData.create(senderID);
                                log.info("DATABASE", `New User: ${senderID} | ${userData.name} | ${config.database.type}`);
                        }
                        else {
                                await findInCreatingUserData.promise;
                        }
                }
                catch (err) {
                        if (err.name != "DATA_ALREADY_EXISTS")
                                log.err("DATABASE", getText("handlerCheckData", "cantCreateUser", senderID), err);
                }
        }

        // ————————— FIX MENTION NAMES FROM EVENT ————————— //
        // Facebook sends the actual display name inside event.mentions.
        // If a user was stored with a fallback name "User {UID}" (getUserInfo was
        // rate-limited when they joined), update their name silently now.
        if (event.mentions && typeof event.mentions === 'object') {
                for (const [uid, mentionText] of Object.entries(event.mentions)) {
                        if (!uid || uid === '0') continue;
                        const mentionName = String(mentionText || '').replace(/^@/, '').trim();
                        if (!mentionName || mentionName === `User ${uid}`) continue;
                        const existingUser = db.allUserData.find(u => u.userID == uid);
                        if (existingUser && existingUser.name === `User ${uid}`) {
                                try {
                                        await usersData.refreshInfo(uid, {
                                                name: mentionName,
                                                gender: existingUser.gender || 0,
                                                vanity: existingUser.vanity || null
                                        });
                                } catch (_) {}
                        }
                }
        }
};