require('./settings')
const makeWASocket = require("@whiskeysockets/baileys").default
const { makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, generateForwardMessageContent, generateWAMessageFromContent, downloadContentFromMessage, jidDecode, proto, Browsers, normalizeMessageContent, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const { makeInMemoryStore } = require("./lib/store/");
const { color } = require('./lib/color')
const fs = require("fs");
const pino = require("pino");
const path = require('path')
const NodeCache = require("node-cache");
const msgRetryCounterCache = new NodeCache();
const fetch = require("node-fetch")
const FileType = require('file-type')
const _ = require('lodash')
const chalk = require('chalk')
const os = require('os');
const moment = require("moment-timezone")
const { File } = require('megajs');
const PhoneNumber = require("awesome-phonenumber");
const readline = require("readline");
const { formatSize, runtime, sleep, serialize, smsg, getBuffer } = require("./lib/myfunc")
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { toAudio, toPTT, toVideo } = require('./lib/converter')

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) }); 

const low = require('./lib/lowdb');
const yargs = require('yargs/yargs');
const { Low, JSONFile } = low;
const versions = require("./package.json").version
const PluginManager = require('./lib/PluginManager');
const modeStatus = 
  global.mode === 'public' ? "Public" : 
  global.mode === 'private' ? "Private" : 
  global.mode === 'group' ? "Group Only" : 
  global.mode === 'pm' ? "PM Only" : "Unknown"; 

const pluginManager = new PluginManager(path.resolve(__dirname, './src/Plugins'));

// Database
const dbName = "FrashX-db";
const dbPath = `${ownernumber}.json`;
const localDb = path.join(__dirname, "src", "database.json");

global.db = new Low(new JSONFile(localDb));

global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise(resolve => setInterval(() => {
        if (!global.db.READ) {
            clearInterval(this);
            resolve(global.db.data ?? global.loadDatabase());
        }
    }, 1000));

    if (global.db.data !== null) return;

    global.db.READ = true;

    try {
        await global.db.read();
        
        if (!global.db.data || Object.keys(global.db.data).length === 0) {
            console.log("[FLASH_MD] Syncing local database...");
            await readDB();
            await global.db.read();
        }

    } catch (error) {
        console.error("❌ Error loading database:", error);
    }

    global.db.READ = false;

    global.db.data = {
    chats: {},
    settings: {},
    blacklist: { blacklisted_numbers: [] }, 
    ...(global.db.data || {}),
  };
  global.db.chain = _.chain(global.db.data);
};

// GitHub Functions
async function getOctokit() {
    const { Octokit } = await import("@octokit/rest");
    return new Octokit({ auth: global.dbToken });
}

async function getOwner(octokit) {
    const user = await octokit.rest.users.getAuthenticated();
    return user.data.login;
}

async function createDB() {
    if (!global.dbToken) return;
    try {
        const octokit = await getOctokit();
        const owner = await getOwner(octokit);
        await octokit.repos.createForAuthenticatedUser({ name: dbName, private: true });
        console.log("[FLASH_MD] Database created successfully.");
    } catch (error) {
        if (error.status === 422) {
            return;
        } else {
            console.error("❌ Error creating repository database:", error);
        }
    }
}

async function readDB() {
    if (!global.dbToken) return;
    try {
        const octokit = await getOctokit();
        const owner = await getOwner(octokit);
        const { data } = await octokit.repos.getContent({ owner, repo: dbName, path: dbPath });

        const content = Buffer.from(data.content, "base64").toString("utf-8");

        if (!content || content.trim() === "{}") {
            return;
        }

        fs.writeFileSync(localDb, content);
        console.log("[FLASH_MD] Synced local database successfully.");
    } catch (error) {
        if (error.status === 404) {
            console.log("[FLASH_MD] Creating database....");
            await writeDB();
        } else {
            console.error("❌ Error reading database from GitHub:", error);
        }
    }
}

global.writeDB = async function () {
    if (!global.dbToken) return;
    try {
        await global.db.write();

        const octokit = await getOctokit();
        const owner = await getOwner(octokit);
        const content = fs.readFileSync(localDb, "utf-8");
        let sha;

        try {
            const { data } = await octokit.repos.getContent({ owner, repo: dbName, path: dbPath });
            sha = data.sha;
        } catch (error) {
            if (error.status !== 404) throw error;
        }

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo: dbName,
            path: dbPath,
            message: `Updated database`,
            content: Buffer.from(content).toString("base64"),
            sha,
        });

        console.log("[FLASH_MD] Successfully synced database.");
    } catch (error) {
        console.error("❌ Error writing database to GitHub:", error);
    }
};

(async () => {
    if (global.dbToken) {
        await createDB();
        await readDB();
    }
    await global.loadDatabase();
})();

if (global.dbToken) {
    setInterval(writeDB, 30 * 60 * 1000);
}

if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write();
}, 30 * 1000);

let phoneNumber = "254754783972"
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")
const usePairingCode = true
const question = (text) => {
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});
return new Promise((resolve) => {
rl.question(text, resolve)
})
};

const storeFile = "./src/store.json";
const maxMessageAge = 24 * 60 * 60; //24 hours

function loadStoredMessages() {
    if (fs.existsSync(storeFile)) {
        try {
            return JSON.parse(fs.readFileSync(storeFile));
        } catch (err) {
            console.error("⚠️ Error loading store.json:", err);
            return {};
        }
    }
    return {};
}

function saveStoredMessages(chatId, messageId, messageData) {
    let storedMessages = loadStoredMessages();

    if (!storedMessages[chatId]) storedMessages[chatId] = {};
    if (!storedMessages[chatId][messageId]) {
        storedMessages[chatId][messageId] = messageData;
        fs.writeFileSync(storeFile, JSON.stringify(storedMessages, null, 2));
    }
} 

function cleanupOldMessages() {
    let now = Math.floor(Date.now() / 1000);
    let storedMessages = {};

    if (fs.existsSync(storeFile)) {
        try {
            storedMessages = JSON.parse(fs.readFileSync(storeFile));
        } catch (err) {
            console.error("❌ Error reading store.json:", err);
            return;
        }
    }

    let totalMessages = 0, oldMessages = 0, keptMessages = 0;

    for (let chatId in storedMessages) {
        let messages = storedMessages[chatId];

        for (let messageId in messages) {
            let messageTimestamp = messages[messageId].timestamp;

            if (typeof messageTimestamp === "object" && messageTimestamp.low !== undefined) {
                messageTimestamp = messageTimestamp.low;
            }

            if (messageTimestamp > 1e12) {
                messageTimestamp = Math.floor(messageTimestamp / 1000);
            }

            totalMessages++;

            if (now - messageTimestamp > maxMessageAge) {
                delete storedMessages[chatId][messageId];
                oldMessages++;
            } else {
                keptMessages++;
            }
        }
        
        if (Object.keys(storedMessages[chatId]).length === 0) {
            delete storedMessages[chatId];
        }
    }

    fs.writeFileSync(storeFile, JSON.stringify(storedMessages, null, 2));

    console.log("[FLASH_MD] 🧹 Cleaning up:");
    console.log(`- Total messages processed: ${totalMessages}`);
    console.log(`- Old messages removed: ${oldMessages}`);
    console.log(`- Remaining messages: ${keptMessages}`);
}

async function loadAllPlugins() {
  try {
    await pluginManager.unloadAllPlugins();
    await pluginManager.loadPlugins();
  } catch (error) {
    console.log(`[FLASH_MD] Error loading plugins: ${error.message}`);
  }
}

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

async function downloadSessionData() {
  try {
    await fs.promises.mkdir(sessionDir, { recursive: true });
    
    if (!fs.existsSync(credsPath) && global.SESSION_ID) {
      const sessdata = global.SESSION_ID.split("XPLOADER-BOT:~")[1];
      const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
      
      filer.download(async (err, data) => {
        if (err) throw err;
        await fs.promises.writeFile(credsPath, data);
        console.log(color(`[FLASH_MD] Session saved successfully`, 'green'));
        await startFrash();
      });
    }
  } catch (error) {
    console.error('Error downloading session data:', error);
  }
}


async function startFrash() {
    let baileysVersion;
    try {
        const { version } = await fetchLatestBaileysVersion();
        baileysVersion = version;
        console.log(color(`[✅] Using Baileys version: ${JSON.stringify(baileysVersion)}`, 'green'));
    } catch (e) {
        console.log(color(`[⚠️] Failed to fetch latest version, using default`, 'yellow'));
        baileysVersion = [2, 3000, 1017531287];
    }

    const {  state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache(); 

    const Frash = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        version: baileysVersion,
        browser: Browsers.ubuntu('Edge'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true, 
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {

            try {
                const jid = key.remoteJid;
                const msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            } catch (err) {
                return "";
            }
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined, 
   })
   
   store.bind(Frash.ev)
   
   
   if(usePairingCode && !Frash.authState.creds.registered) {
       if (useMobile) throw new Error('Cannot use pairing code with mobile API');

       let pn = await question(chalk.bgBlack(chalk.greenBright(`Number to be connected to Frash Bot?\nExample 254796180105:- `)))
       pn = pn.trim();

       setTimeout(async () => {
           try {
               const code = await Frash.requestPairingCode(pn);
               console.log(chalk.black(chalk.bgWhite(`[FLASH_MD]:- ${code}`)));
           } catch (err) {
               console.error("Failed to request pairing code:", err);
           }
       }, 3000);
   }


Frash.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update      
    try {
        if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode != 401) {
            const status = lastDisconnect.error.output.statusCode;
            if (status === DisconnectReason.loggedOut) console.log("Logged out. Please link again.");
            if (status === DisconnectReason.badSession) console.log("Bad session. Log out and link again.");
            // attempt restart
            await sleep(2000);
            startFrash();
        }

        if (update.connection == "connecting") {
            console.log(color(`[FLASH_MD] Connecting...`, 'red'))
        }
        if (update.connection == "open") {
            console.log(color(`[FLASH_MD] Connected`, 'green'))

            await sleep(2000);

            try {
                await Frash.sendMessage(Frash.user.id, { text: `┏━━─『 FLASH_MD 』─━━
┃ ♤ Username: ${Frash.user.name}
┃ ♤ Platform: ${os.platform()}
┃ ♤ Prefix: [ ${global.prefixz} ]
┃ ♤ Mode: ${modeStatus}
┃ ♤ Version: [ ${versions} ]
 ` }, { ephemeralExpiration: 20 });
            } catch (e) {

            }
        }

    } catch (err) {
        console.log('Error in Connection.update '+err)
        startFrash();
    }
})

Frash.ev.on('creds.update', saveCreds);

Frash.ev.on('messages.upsert', async (chatUpdate) => {
  try {
    const messages = chatUpdate.messages;
    if (!messages || messages.length === 0) return;

    // Keep per-upsert processed set to avoid duplicates in same batch
    const processedMessages = new Set();

    for (const kay of messages) {
      try {
        if (!kay.message) continue;

        // normalize message shape
        kay.message = normalizeMessageContent(kay.message);

        if (kay.key && kay.key.remoteJid === 'status@broadcast') {
          if (global.autoviewstatus === 'true') {
            await Frash.readMessages([kay.key]).catch(() => {});
          }

          if (global.autoreactstatus === 'true' && global.autoviewstatus === 'true') {
            const reactionEmoji = global.statusemoji || '💚';
            const participant = kay.key.participant || kay.participant;
            const botJid = await Frash.decodeJid(Frash.user.id);
            const messageId = kay.key.id;

            if (participant && messageId && kay.key.remoteJid) {
              await Frash.sendMessage(
                'status@broadcast',
                {
                  react: {
                    key: {
                      id: kay.key.id, 
                      remoteJid: kay.key.remoteJid, 
                      participant: participant,
                    },
                    text: reactionEmoji,
                  },
                },
                { statusJidList: [participant, botJid] }
              ).catch(() => {});
            }
          }

          continue; 
        }

        // basic sanity checks for message id
        if (!kay.key || !kay.key.id) continue;

        const messageId = kay.key.id;
        if (processedMessages.has(messageId)) continue;
        processedMessages.add(messageId);

        const m = smsg(Frash, kay, store);
        require('./system')(Frash, m, chatUpdate, store);
      } catch (inner) {
        console.error('Error processing a message in upsert loop:', inner);
      }
    }
  } catch (err) {
    console.error('Error handling messages.upsert:', err);
  }
});

Frash.ev.on("messages.upsert", async (chatUpdate) => {
    for (const msg of chatUpdate.messages) {
        try {
            if (!msg.message) continue;

            let chatId = msg.key.remoteJid;
            let messageId = msg.key.id;

            saveStoredMessages(chatId, messageId, msg);
        } catch (e) {
            console.error('Error saving stored message:', e);
        }
    }
});

setInterval(() => {
  try {
    const sessionPath = path.join(__dirname, 'session');
    fs.readdir(sessionPath, (err, files) => {
      if (err) {
        console.error("Unable to scan directory:", err);
        return;
      }

      const now = Date.now();
      const filteredArray = files.filter((item) => {
        const filePath = path.join(sessionPath, item);
        const stats = fs.statSync(filePath);

        return (
          (item.startsWith("pre-key") ||
           item.startsWith("sender-key") ||
           item.startsWith("session-") ||
           item.startsWith("app-state")) &&
          item !== 'creds.json' &&
          now - stats.mtimeMs > 2 * 24 * 60 * 60 * 1000
        );
      });

      if (filteredArray.length > 0) {
        console.log(`Found ${filteredArray.length} old session files.`);
        console.log(`Clearing ${filteredArray.length} old session files...`);

        filteredArray.forEach((file) => {
          const filePath = path.join(sessionPath, file);
          fs.unlinkSync(filePath);
        });
      } else {
        // no noisy logs every interval
      }
    });
  } catch (error) {
    console.error('Error clearing old session files:', error);
  }
}, 7200000); 

setInterval(cleanupOldMessages, 60 * 60 * 1000);

function createTmpFolder() {
const folderName = "tmp";
const folderPath = path.join(__dirname, folderName);

if (!fs.existsSync(folderPath)) {
fs.mkdirSync(folderPath);
   }
 }
 
createTmpFolder();

setInterval(() => {
let directoryPath = path.join(__dirname, 'tmp'); // fixed: was path.join() with no args
fs.readdir(directoryPath, async function (err, files) {
if (err) return;
var filteredArray = await files.filter(item =>
item.endsWith("gif") ||
item.endsWith("png") || 
item.endsWith("mp3") ||
item.endsWith("mp4") || 
item.endsWith("opus") || 
item.endsWith("jpg") ||
item.endsWith("webp") ||
item.endsWith("webm") ||
item.endsWith("zip") 
)
if(filteredArray.length > 0){
let teks =`Detected ${filteredArray.length} junk files,\nJunk files have been deleted🚮`
try { Frash.sendMessage(Frash.user.id, {text : teks }) } catch(e){}
setInterval(() => {
if(filteredArray.length == 0) return console.log("Junk files cleared")
filteredArray.forEach(function (file) {
let sampah = fs.existsSync(path.join(directoryPath, file))
if(sampah) fs.unlinkSync(path.join(directoryPath, file))
})
}, 15_000)
}
});
}, 30_000)

Frash.decodeJid = (jid) => {
if (!jid) return jid;
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {};
return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
} else return jid;
};

Frash.ev.on("contacts.update", (update) => {
for (let contact of update) {
let id = Frash.decodeJid(contact.id);
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
}
});

Frash.ev.on('group-participants.update', async ({ id, participants, action }) => {
  if (global.welcome === 'true') {
    try {
      const groupData = await Frash.groupMetadata(id);
      const groupMembers = groupData.participants.length;
      const groupName = groupData.subject;

      for (const participant of participants) {
        const userPic = await getUserPicture(participant);
        const groupPic = await getGroupPicture(id);

        if (action === 'add') {
          sendWelcomeMessage(id, participant, groupName, groupMembers, userPic);
        } else if (action === 'remove') {
          sendGoodbyeMessage(id, participant, groupName, groupMembers, userPic);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
});

async function getUserPicture(userId) {
  try {
    return await Frash.profilePictureUrl(userId, 'image');
  } catch {
    return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60';
  }
}

async function getGroupPicture(groupId) {
  try {
    return await Frash.profilePictureUrl(groupId, 'image');
  } catch {
    return 'https://i.ibb.co/RBx5SQC/avatar-group-large-v2.png?q=60';
  }
}

async function sendWelcomeMessage(groupId, participant, groupName, memberCount, profilePic) {
const welcomeMessage = `✨ *Welcome to ${groupName}!* ✨ @${participant.split('@')[0]}

You're our ${memberCount}th member!

Join time: ${moment.tz(`${timezones}`).format('HH:mm:ss')},  ${moment.tz(`${timezones}`).format('DD/MM/YYYY')}

Stay awesome!😊

> ${global.wm}`;
 Frash.sendMessage(groupId, {
    text: welcomeMessage,
    contextInfo: {
      mentionedJid: [participant],
      externalAdReply: {
        title: global.botname,
        body: ownername,
        previewType: 'PHOTO',
        thumbnailUrl: '',
        thumbnail: await getBuffer(profilePic),
        sourceUrl: plink
      }
    }
  });
}

async function sendGoodbyeMessage(groupId, participant, groupName, memberCount, profilePic) {
const goodbyeMessage = `✨ *Goodbye @${participant.split('@')[0]}!* ✨

You'll be missed in ${groupName}!🥲

We're now ${memberCount} members.

Left at: ${moment.tz(timezones).format('HH:mm:ss')},  ${moment.tz(timezones).format('DD/MM/YYYY')}

> ${global.wm}`;

  Frash.sendMessage(groupId, {
    text: goodbyeMessage,
    contextInfo: {
      mentionedJid: [participant],
      externalAdReply: {
        title: global.botname,
        body: ownername,
        previewType: 'PHOTO',
        thumbnailUrl: '',
        thumbnail: await getBuffer(profilePic),
        sourceUrl: plink
      }
    }
  });
}
//------------------------------------------------------
//anticall
Frash.ev.on('call', async (incomingCalls) => {
    let botId = await Frash.decodeJid(Frash.user.id);
    
    if (!["decline", "block"].includes(global.anticall)) return;

    console.log(incomingCalls);

    for (let call of incomingCalls) {
        if (!call.isGroup && call.status === "offer") { 
            let message = `📵 *𝙲𝙰𝙻𝙻 𝙳𝙴𝚃𝙴𝙲𝚃𝙴𝙳!* 📵\n\n`;
            message += `@${call.from.split('@')[0]}, my owner cannot receive ${call.isVideo ? `video` : `audio`} calls at the moment.\n\n`;

            if (global.anticall === "block") {
                message += `❌ You are being *blocked* for causing a disturbance. If this was a mistake, contact my owner to be unblocked.`;
            } else {
                message += `⚠️ Your call has been *declined*. Please avoid calling.`;
            }

            await Frash.sendTextWithMentions(call.from, message);
            await Frash.rejectCall(call.id, call.from);

            if (global.anticall === "block") {
                await sleep(8000);
                await Frash.updateBlockStatus(call.from, "block");
            }
        }
    }
});

Frash.serializeM = (m) => smsg(Frash, m, store)

Frash.getName = (jid, withoutContact = false) => {
id = Frash.decodeJid(jid);
withoutContact = Frash.withoutContact || withoutContact;
let v;
if (id.endsWith("@g.us"))
return new Promise(async (resolve) => {
v = store.contacts[id] || {};
if (!(v.name || v.subject)) v = Frash.groupMetadata(id) || {};
resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
});
else
v =
id === "0@s.whatsapp.net"
? {
id,
name: "WhatsApp",
}
: id === Frash.decodeJid(Frash.user.id)
? Frash.user
: store.contacts[id] || {};
return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
};

Frash.getFile = async (PATH, returnAsFilename) => {
    let res, filename;
    const data = Buffer.isBuffer(PATH) 
        ? PATH 
        : /^data:.*?\/.*?;base64,/i.test(PATH) 
        ? Buffer.from(PATH.split`, `[1], 'base64') 
        : /^https?:\/\//.test(PATH) 
        ? await (res = await fetch(PATH)).buffer() 
        : fs.existsSync(PATH) 
        ? (filename = PATH, fs.readFileSync(PATH)) 
        : typeof PATH === 'string' 
        ? PATH 
        : Buffer.alloc(0);

    if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
    
    const type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
    
    if (returnAsFilename && !filename) {
        filename = path.join(__dirname, './tmp/' + new Date() * 1 + '.' + type.ext);
        await fs.promises.writeFile(filename, data);
    }
    
    const deleteFile = async () => {
        if (filename && fs.existsSync(filename)) {
            await fs.promises.unlink(filename).catch(() => {}); 
        }
    };

    setImmediate(deleteFile);
    data.fill(0); 
    
    return { res, filename, ...type, data, deleteFile };
};

Frash.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];

    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    const data = Buffer.from(buffer); 
    buffer.fill(0); 
    buffer = null;

    return data;
};

Frash.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
let type = await Frash.getFile(path, true)
let { res, data: file, filename: pathFile } = type
if (res && res.status !== 200 || file.length <= 65536) {
try { throw { json: JSON.parse(file.toString()) } }
catch (e) { if (e.json) throw e.json }
}
let opt = { filename }
if (quoted) opt.quoted = quoted
if (!type) options.asDocument = true
let mtype = '', mimetype = type.mime, convert
if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
else if (/video/.test(type.mime)) mtype = 'video'
else if (/audio/.test(type.mime)) (
convert = await (ptt ? toPTT : toAudio)(file, type.ext),
file = convert.data,
pathFile = convert.filename,
mtype = 'audio',
mimetype = 'audio/ogg; codecs=opus'
)
else mtype = 'document'
if (options.asDocument) mtype = 'document'

let message = {
...options,
caption,
ptt,
[mtype]: { url: pathFile },
mimetype
}
let m
try {
m = await Frash.sendMessage(jid, message, { ...opt, ...options })
} catch (e) {
console.error(e)
m = null
} finally {
if (!m) m = await Frash.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
return m
}
}

Frash.copyNForward = async (jid, message, forceForward = false, options = {}) => {
let vtype
if (options.readViewOnce) {
message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
vtype = Object.keys(message.message.viewOnceMessage.message)[0]
delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
delete message.message.viewOnceMessage.message[vtype].viewOnce
message.message = {
...message.message.viewOnceMessage.message
}
}
let mtype = Object.keys(message.message)[0]
let content = await generateForwardMessageContent(message, forceForward)
let ctype = Object.keys(content)[0]
let context = {}
if (mtype != "conversation") context = message.message[mtype].contextInfo
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo
}
const waMessage = await generateWAMessageFromContent(jid, content, options ? {
...content[ctype],
...options,
...(options.contextInfo ? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo
}
} : {})
} : {})
await Frash.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
return waMessage
}

Frash.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)
}
await Frash.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

Frash.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];

    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
    let savePath = path.join(__dirname, 'tmp', trueFileName); // Save to 'tmp' folder

    await fs.writeFileSync(savePath, buffer);

    buffer = null; 
    global.gc?.(); 

    return savePath;
};

Frash.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}
await Frash.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}
Frash.sendText = (jid, text, quoted = '', options) => Frash.sendMessage(jid, { text: text, ...options }, { quoted })

Frash.sendTextWithMentions = async (jid, text, quoted, options = {}) => Frash.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

return Frash;
}

async function tylor() {
    await cleanupOldMessages();
    await loadAllPlugins();
    if (fs.existsSync(credsPath)) {
        await startFrash();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            await startFrash();
        } else {
            if (!fs.existsSync(credsPath)) {
                if (!global.SESSION_ID) {
                    console.log(color("Please wait for a few seconds to enter your number!", 'red'));
             await startFrash();
                }
            }
        }
    }
}

tylor();

module.exports.pluginManager = pluginManager