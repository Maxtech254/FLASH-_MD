console.clear();
console.log('Starting Vinic-Xmd...');
const settings = require('./settings'); // Use settings.js for SESSION_ID, ownername, prefa, owner
const config = require('./setting/config'); // Keep config for other settings
const { handleChatbot } = require('./vinic');
process.on("uncaughtException", console.error);

const {
  default: makeWASocket,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  getContentType,
  jidDecode,
  MessageRetryMap,
  getAggregateVotesInPollMessage,
  proto,
  delay
} = require("@whiskeysockets/baileys");

const pino = require('pino');
const readline = require("readline");
const fs = require('fs');
const os = require('os');
const more = String.fromCharCode(8206);
const chalk = require('chalk');
const _ = require('lodash');
const NodeCache = require("node-cache");
const lolcatjs = require('lolcatjs');
const readmore = more.repeat(4001);
const util = require('util');
const axios = require('axios');
const fetch = require('node-fetch');
const timezones = global.timezones || "Africa/Kampala"; // Default to Uganda timezone
const moment = require('moment-timezone');
const FileType = require('file-type');
const { Boom } = require('@hapi/boom');
const PhoneNumber = require('awesome-phonenumber');
const { File } = require('megajs');
const { color } = require('./start/lib/color');

const {
  smsg,
  sendGmail,
  formatSize,
  isUrl,
  generateMessageTag,
  getBuffer,
  getSizeMedia,
  runtime,
  fetchJson,
  sleep
} = require('./start/lib/myfunction');

const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid
} = require('./start/lib/exif');

// Define constants for session handling
const SESSION_DIR = './session';
const CREDS_PATH = `${SESSION_DIR}/creds.json`;

const usePairingCode = true;

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const yargs = require('yargs/yargs');

async function downloadSessionData() {
  console.log("[DEBUG] SESSION_ID:", settings.SESSION_ID);
  try {
    if (typeof settings.SESSION_ID === 'undefined') {
      throw new Error("SESSION_ID is undefined in settings");
    }
    if (!settings.SESSION_ID) {
      console.warn("[ ⏳ ] No SESSION_ID provided - Falling back to QR or pairing code");
      return null;
    }
    if (settings.SESSION_ID.startsWith("starcore~")) {
      console.info("[ ⏳ ] Decoding base64 session");
      const base64Data = settings.SESSION_ID.replace("starecore~", "");
      if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
        throw new Error("Invalid base64 format in SESSION_ID");
      }
      const decodedData = Buffer.from(base64Data, "base64");
      let sessionData;
      try {
        sessionData = JSON.parse(decodedData.toString("utf-8"));
      } catch (error) {
        throw new Error("Failed to parse decoded base64 session data: " + error.message);
      }
      fs.writeFileSync(CREDS_PATH, JSON.stringify(sessionData, null, 2));
      console.log("[ ✅ ] Base64 session decoded and saved successfully");
      return sessionData;
    } else if (settings.SESSION_ID.startsWith("malvin~")) {
      console.info("[ 📥 ] Downloading MEGA.nz session");
      const megaFileId = settings.SESSION_ID.replace("malvin~", "");
      const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
      const data = await new Promise((resolve, reject) => {
        filer.download((err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      fs.writeFileSync(CREDS_PATH, data);
      console.log("[ ✅ ] MEGA session downloaded successfully");
      return JSON.parse(data.toString());
    } else {
      throw new Error("Invalid SESSION_ID format. Use 'starcore~' for base64 or 'malvin~' for MEGA.nz");
    }
  } catch (error) {
    console.error("[ ❌ ] Error loading session", { Error: error.message, Stack: error.stack });
    console.info("[ 😑 ] Will attempt pairing code login");
    return null;
  }
}

// ========== MESSAGE STORAGE FUNCTIONS ==========
function loadStoredMessages() {
    try {
        if (fs.existsSync('./start/lib/database/store.json')) {
            const data = fs.readFileSync('./start/lib/database/store.json', 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading stored messages:', error);
    }
    return {};
}

function saveStoredMessage(message) {
    try {
        let storedMessages = loadStoredMessages();
        const chatId = message.key.remoteJid;
        const messageId = message.key.id;
        
        if (!storedMessages[chatId]) {
            storedMessages[chatId] = {};
        }
        
        // Store only essential information to avoid memory issues
        storedMessages[chatId][messageId] = {
            key: { ...message.key },
            message: { ...message.message },
            messageTimestamp: message.messageTimestamp || Date.now(),
            pushName: message.pushName || "Unknown",
            sender: message.key.participant || message.key.remoteJid
        };
        
        // Extract text content for easier retrieval
        let textContent = "";
        if (message.message?.conversation) {
            textContent = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
            textContent = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage?.caption) {
            textContent = message.message.imageMessage.caption;
        } else if (message.message?.videoMessage?.caption) {
            textContent = message.message.videoMessage.caption;
        }
        
        storedMessages[chatId][messageId].text = textContent;
        
        // Limit stored messages per chat to prevent excessive memory usage
        const messageKeys = Object.keys(storedMessages[chatId]);
        if (messageKeys.length > 100) {
            // Remove oldest messages
            const sortedMessages = messageKeys.map(id => ({
                id,
                timestamp: storedMessages[chatId][id].messageTimestamp || 0
            })).sort((a, b) => a.timestamp - b.timestamp);
            
            // Remove oldest 20 messages
            sortedMessages.slice(0, 20).forEach(msg => {
                delete storedMessages[chatId][msg.id];
            });
        }
        
        fs.writeFileSync('./start/lib/database/store.json', JSON.stringify(storedMessages, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving message:', error);
        return false;
    }
}

// ========== ANTI-EDIT FUNCTIONALITY ==========
async function handleAntiEdit(m, conn) {
    try {
        // Check if this is an edited message
        if (!m.message?.protocolMessage?.editedMessage || !m.message?.protocolMessage?.key) {
            return;
        }

        // Skip if antiedit is disabled
        if (!global.antiedit || global.antiedit === 'off') {
            return;
        }

        const messageId = m.message.protocolMessage.key.id;
        const chatId = m.key.remoteJid;
        const editedBy = m.key.participant || m.key.remoteJid;

        const storedMessages = loadStoredMessages();
        const originalMsg = storedMessages[chatId]?.[messageId];

        if (!originalMsg) {
            console.log("⚠️ Original message not found in database for edit detection.");
            return;
        }

        const sender = originalMsg.sender;
        let chatName = "Unknown Chat";

        // Determine chat name
        if (chatId === 'status@broadcast') {
            chatName = "Status Update";
        } else if (chatId.endsWith('@g.us')) {
            try {
                const groupInfo = await conn.groupMetadata(chatId).catch(() => null);
                chatName = groupInfo?.subject || "Group Chat";
            } catch {
                chatName = "Group Chat";
            }
        } else {
            chatName = originalMsg.pushName || "Private Chat";
        }

        const xtipes = moment((originalMsg.messageTimestamp || Date.now()) * 1000)
            .tz(timezones || "Africa/Kampala")
            .locale('en')
            .format('HH:mm z');
            
        const xdptes = moment((originalMsg.messageTimestamp || Date.now()) * 1000)
            .tz(timezones || "Africa/Kampala")
            .format("DD/MM/YYYY");

        // Get edited text
        const editedMessage = m.message.protocolMessage.editedMessage;
        let editedText = "";
        
        if (editedMessage.conversation) {
            editedText = editedMessage.conversation;
        } else if (editedMessage.extendedTextMessage?.text) {
            editedText = editedMessage.extendedTextMessage.text;
        }

        const replyText = `🚨 *𝙴𝙳𝙸𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴!* 🚨
${readmore}
𝙲𝙷𝙰𝚃: ${chatName}
𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
𝚃𝙸𝙼𝙴 𝚂𝙴𝙽𝚃: ${xtipes}
𝙳𝙰𝚃𝙴 𝚂𝙴𝙽𝚃: ${xdptes}
𝙴𝙳𝙸𝚃𝙴𝙳 𝙱𝚈: @${editedBy.split('@')[0]}

𝙾𝚁𝙸𝙶𝙸𝙽𝙰𝙻 𝙼𝙴𝚂𝚂𝙰𝙶𝙴: ${originalMsg.text || '[Media content]'}

𝙴𝙳𝙸𝚃𝙴𝙳 𝚃𝙾: ${editedText}`;

        const botNumber = await conn.decodeJid(conn.user.id);
        
        // Determine where to send the notification based on antiedit mode
        let targetChat;
        if (global.antiedit === 'private') {
            targetChat = botNumber; // Send to bot owner
        } else if (global.antiedit === 'chat') {
            targetChat = chatId; // Send to the chat where edit occurred
        } else {
            return; // Antiedit is off
        }

        const quotedMessage = {
            key: {
                remoteJid: chatId,
                fromMe: sender === botNumber,
                id: messageId,
                participant: sender
            },
            message: {
                conversation: originalMsg.text || "Media content"
            }
        };

        // Send the anti-edit notification
        await conn.sendMessage(
            targetChat,
            { 
                text: replyText, 
                mentions: [sender, editedBy].filter(Boolean) 
            },
            { quoted: quotedMessage }
        );

        console.log(`✅ Anti-edit triggered for message ${messageId} in ${chatName}`);

    } catch (err) {
        console.error("❌ Error processing edited message:", err);
    }
}

// ========== ANTI-DELETE FUNCTIONALITY ==========
async function handleAntiDelete(m, conn) {
    try {
        if (!m.message?.protocolMessage?.type === 0 || !m.message?.protocolMessage?.key) {
            return;
        }

        const messageId = m.message.protocolMessage.key.id;
        const chatId = m.key.remoteJid;
        const deletedBy = m.key.participant || m.key.remoteJid;

        const storedMessages = loadStoredMessages();
        const deletedMsg = storedMessages[chatId]?.[messageId];

        if (!deletedMsg) {
            console.log("⚠️ Deleted message not found in database.");
            return;
        }

        const botNumber = await conn.decodeJid(conn.user.id);
        
        // Determine where to send the notification
        let targetChat;
        if (global.antidelete === 'private') {
            targetChat = botNumber; // Send to bot owner
        } else if (global.antidelete === 'chat') {
            targetChat = chatId; // Send to the chat where deletion occurred
        } else {
            return; // Anti-delete is off
        }

        const sender = deletedMsg.sender;
        let chatName = "Unknown Chat";

        // Determine chat name
        if (chatId === 'status@broadcast') {
            chatName = "Status Update";
        } else if (chatId.endsWith('@g.us')) {
            try {
                const groupInfo = await conn.groupMetadata(chatId).catch(() => null);
                chatName = groupInfo?.subject || "Group Chat";
            } catch {
                chatName = "Group Chat";
            }
        } else {
            chatName = deletedMsg.pushName || "Private Chat";
        }

        const xtipes = moment((deletedMsg.messageTimestamp || Date.now()) * 1000)
            .tz(timezones || "Africa/Kampala")
            .locale('en')
            .format('HH:mm z');
            
        const xdptes = moment((deletedMsg.messageTimestamp || Date.now()) * 1000)
            .tz(timezones || "Africa/Kampala")
            .format("DD/MM/YYYY");

        const replyText = `🚨 *𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴!* 🚨
${readmore}
𝙲𝙷𝙰𝚃: ${chatName}
𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
𝚃𝙸𝙼𝙴 𝚂𝙴𝙽𝚃: ${xtipes}
𝙳𝙰𝚃𝙴 𝚂𝙴𝙽𝚃: ${xdptes}
𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙱𝚈: @${deletedBy.split('@')[0]}

𝙼𝙴𝚂𝚂𝙰𝙶𝙴: ${deletedMsg.text || '[Media content]'}`;

        const quotedMessage = {
            key: {
                remoteJid: chatId,
                fromMe: sender === botNumber,
                id: messageId,
                participant: sender
            },
            message: {
                conversation: deletedMsg.text || "Media content"
            }
        };

        // Send to appropriate location based on anti-delete mode
        await conn.sendMessage(
            targetChat,
            { 
                text: replyText, 
                mentions: [sender, deletedBy].filter(Boolean) 
            },
            { quoted: quotedMessage }
        );

    } catch (err) {
        console.error("❌ Error processing deleted message:", err);
    }
}

async function clientstart() {
  // Ensure session directory exists
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR);
  }

  // Check and download session data
  const sessionExists = await downloadSessionData();

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState("./session");
  const conn = makeWASocket({
    printQRInTerminal: !usePairingCode,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    generateHighQualityLinkPreview: true,
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage
      );
      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
    version: (await (await fetch('https://github.com/kiuur/bails/raw/refs/heads/master/lib/Defaults/baileys-version.json')).json()).version,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    logger: pino({
      level: 'fatal'
    }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino().child({
        level: 'silent',
        stream: 'store'
      })),
    }
  });

  // Only prompt for pairing code if session data is not available
  if (!sessionExists && !conn.authState.creds.registered) {
    const phoneNumber = await question(chalk.blue.bold(`Thanks for choosing Vinic-Xmd. Please provide your number start with 256xxx:\n`));
    const code = await conn.requestPairingCode(phoneNumber.trim());
    console.log(chalk.cyan(`Code: ${code}`));
    console.log(chalk.cyan(`Vinic-Xmd: Please use this code to connect your WhatsApp account.`));
  }

  const { makeInMemoryStore } = require("@rodrigogs/baileys-store");
  const store = makeInMemoryStore({
    logger: pino().child({
      level: 'silent',
      stream: 'store'
    })
  });

  store.bind(conn.ev);

  conn.ev.on('messages.upsert', async chatUpdate => {
    try {
        let mek = chatUpdate.messages[0];
        if (!mek.message) return;
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

        //status broadcast handling 
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            if (global.autoviewstatus === 'true') {
                await conn.readMessages([mek.key]);
            }
            
            if (global.autoreactstatus === 'true' && global.autoviewstatus === 'true') {
                const reactionEmoji = global.statusemoji || '💚';
                const participant = mek.key.participant || mek.participant;
                const botJid = await conn.decodeJid(conn.user.id);
                const messageId = mek.key.id;
                
                if (participant && messageId && mek.key.id && mek.key.remoteJid) {
                    await conn.sendMessage(
                        'status@broadcast',
                        {
                            react: {
                                key: {
                                    id: mek.key.id, 
                                    remoteJid: mek.key.remoteJid, 
                                    participant: participant,
                                },
                                text: reactionEmoji,
                            },
                        },
                        { statusJidList: [participant, botJid] }
                    );
                }
            }
            return; // Skip further processing for status messages
        }

        if (!conn.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
        let m = smsg(conn, mek, store);
        
        // Save all incoming messages for anti-delete/anti-edit
        saveStoredMessage(mek);
        
        // Handle edited messages (anti-edit)
        await handleAntiEdit(mek, conn);
        
        // Handle deleted messages (anti-delete)
        await handleAntiDelete(mek, conn);
        
        // Handle chatbot before processing commands
        await handleChatbot(m);
        
        // Process commands as usual
        require("./start/kevin")(conn, m, chatUpdate, mek, store);
    } catch (err) {
        console.log(chalk.yellow.bold("[ ERROR ] kevin.js :\n") + chalk.redBright(util.format(err)));
    }
  });

  conn.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return decode.user && decode.server && decode.user + '@' + decode.server || jid;
    } else return jid;
  };

  conn.ev.on('contacts.update', update => {
    for (let contact of update) {
      let id = conn.decodeJid(contact.id);
      if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
    }
  });

  // ... (rest of your existing functions remain the same)

  conn.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
    const mentionedJid = [...text.matchAll(/@(\d{0,16})/g)].map(
      (v) => v[1] + "@s.whatsapp.net",
    );
    return conn.sendMessage(jid, {
      text: text,
      contextInfo: {
        mentionedJid: mentionedJid,
      },
      ...options,
    }, { quoted });
  };

  conn.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    let buff;
    try {
      buff = Buffer.isBuffer(path)
        ? path
        : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split`,`[1], 'base64')
        : /^https?:\/\//.test(path)
        ? await (await getBuffer(path))
        : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);
    } catch (e) {
      console.error('Error getting buffer:', e);
      buff = Buffer.alloc(0);
    }

    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff);
    }

    await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
  };

  conn.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff;
    try {
      buff = Buffer.isBuffer(path)
        ? path
        : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split`,`[1], 'base64')
        : /^https?:\/\//.test(path)
        ? await (await getBuffer(path))
        : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);
    } catch (e) {
      console.error('Error getting buffer:', e);
      buff = Buffer.alloc(0);
    }

    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }

    await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
  };

  conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype
      ? message.mtype.replace(/Message/gi, "")
      : mime.split("/")[0];

    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? (filename + "." + (type ? type.ext : 'bin')) : filename;
    await fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  conn.getName = async (jid, withoutContact = false) => {
    let id = conn.decodeJid(jid);
    withoutContact = conn.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us")) {
      return new Promise(async (resolve) => {
        try {
          v = store.contacts[id] || {};
          if (!(v.name || v.subject)) v = await conn.groupMetadata(id) || {};
          resolve(
            v.name ||
            v.subject ||
            PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international")
          );
        } catch (e) {
          resolve(PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
        }
      });
    } else {
      v = id === "0@s.whatsapp.net"
        ? { id, name: "WhatsApp" }
        : id === conn.decodeJid(conn.user.id)
        ? conn.user
        : store.contacts[id] || {};
      return (
        (withoutContact ? "" : v.name) ||
        v.subject ||
        v.verifiedName ||
        PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international")
      );
    }
  };

  conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
    let list = [];
    for (let i of kon) {
      const name = await conn.getName(i);
      list.push({
        displayName: name,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:jangan spam bang\nitem2.EMAIL;type=INTERNET:Zuurzyen\nitem2.X-ABLabel:YouTube\nitem3.URL:Zuuryzen.tech\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;Indonesia;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
      });
    }
    conn.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted });
  };

  conn.serializeM = (m) => smsg(conn, m, store);

  conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let vtype;
    if (options.readViewOnce) {
      message.message = message.message?.ephemeralMessage?.message || message.message;
      vtype = Object.keys(message.message.viewOnceMessage.message)[0];
      delete message.message.viewOnceMessage.message[vtype].viewOnce;
      message.message = { ...message.message.viewOnceMessage.message };
    }

    let mtype = Object.keys(message.message)[0];
    let content = await generateForwardMessageContent(message, forceForward);
    let ctype = Object.keys(content)[0];
    let context = {};

    if (mtype != "conversation") {
      context = message.message[mtype].contextInfo;
    }

    content[ctype].contextInfo = {
      ...context,
      ...content[ctype].contextInfo,
    };

    const waMessage = await generateWAMessageFromContent(
      jid,
      content,
      options
        ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo
              ? {
                  contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo,
                  },
                }
              : {}),
          }
        : {}
    );

    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    return waMessage;
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getTypeMessage(message) {
    if (!message) return 'unknown';
    const type = Object.keys(message);
    var restype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) ||
      (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) ||
      type[type.length - 1] || Object.keys(message)[0];
    return restype;
  }

  conn.prefa = settings.prefa; // Use prefa from settings.js
  conn.public = config.autoviewstatus || true;
  conn.serializeM = (m) => smsg(conn, m, store);

  conn.ev.on('connection.update', async (update) => {
    let { Connecting } = require("./start/lib/connection/connect.js");
    Connecting({ update, conn, Boom, DisconnectReason, sleep, color, clientstart });
  });
  

  conn.ev.on('group-participants.update', async (anu) => {
    if (config.welcome) {
      try {
        const groupMetadata = await conn.groupMetadata(anu.id);
        const participants = anu.participants;
        for (const participant of participants) {
          let ppUrl;
          try {
            ppUrl = await conn.profilePictureUrl(participant, 'image');
          } catch {
            ppUrl = 'https://i.ibb.co/sFjX3nP/default.jpg';
          }
          const name = (await conn.onWhatsApp(participant))[0]?.notify || participant;
          if (anu.action === 'add') {
            const memberCount = groupMetadata.participants.length;
            await conn.sendMessage(anu.id, {
              image: { url: ppUrl },
              caption: `
  ║➳  *${config.botname} welcome* @${participant.split('@')[0]}  
  ║➳  𝙶𝚛𝚘𝚞𝚙𝙽𝚊𝚖𝚎: *${groupMetadata.subject}*
  ║➳ *You're our ${memberCount}th member!*
  *Total members*: ${memberCount}
  ║➳  𝙲𝚊𝚞𝚜𝚎 𝚌𝚑𝚊𝚘𝚜 𝚒𝚝𝚜 𝚊𝚕𝚠𝚊𝚢𝚜 𝚏𝚞𝚗
              `,
              mentions: [participant]
            });
          } else if (anu.action === 'remove') {
            const memberCount = groupMetadata.participants.length;
            await conn.sendMessage(anu.id, {
              image: { url: ppUrl },
              caption: `
  ║➳  *👋 Goodbye* 😪 @${participant.split('@')[0]}
  ║➳ We're now ${memberCount} members.
  ║➳  *Total members*: ${memberCount}
              `,
              mentions: [participant]
            });
          }
        }
      } catch (err) {
        console.error('Error in group-participants.update:', err);
      }
    }
    if (config.adminevent) {
      console.log(anu);
      let botNumber = await conn.decodeJid(conn.user.id);
      if (anu.participants.includes(botNumber)) return;
      try {
        let metadata = await conn.groupMetadata(anu.id);
        let participants = anu.participants;
        for (let num of participants) {
          let check = anu.author !== num && anu.author && anu.author.length > 1;
          let tag = check ? [anu.author, num] : [num];
          let ppuser;
          try {
            ppuser = await conn.profilePictureUrl(num, 'image');
          } catch {
            ppuser = 'https://telegra.ph/file/de7c8230aff02d7bd1a93.jpg';
          }
          if (anu.action == "promote") {
            conn.sendMessage(anu.id, {
              text: `@${anu.author.split("@")[0]} 𝗛𝗮𝘀 𝗽𝗿𝗼𝗺𝗼𝘁𝗲𝗱 @${num.split("@")[0]} 𝗔𝘀 𝗮𝗱𝗺𝗶𝗻`,
              mentions: tag
            });
          }
          if (anu.action == "demote") {
            conn.sendMessage(anu.id, {
              text: `@${anu.author.split("@")[0]} 𝗛𝗮𝘀 𝗱𝗲𝗺𝗼𝘁𝗲𝗱 @${num.split("@")[0]} 𝗔𝘀 𝗮𝗱𝗺𝗶𝗻`,
              mentions: tag
            });
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  });

// ========== ANTICALL FUNCTIONALITY =======
// Initialize anticall setting if not exists
if (typeof global.anticall === 'undefined') {
    global.anticall = "off"; // Default value
}

// Initialize antiedit setting if not exists
if (typeof global.antiedit === 'undefined') {
    global.antiedit = "off"; // Default value
}

// Initialize antidelete setting if not exists
if (typeof global.antidelete === 'undefined') {
    global.antidelete = "off"; // Default value
}

// Anticall event handler
conn.ev.on('call', async (callData) => {
    try {
        // Skip if anticall is disabled
        if (global.anticall === "off") return;
        
        // Handle both single call and array of calls
        const calls = Array.isArray(callData) ? callData : [callData];
        
        for (let call of calls) {
            if (!call.isGroup && call.status === "offer") {
                const caller = call.from;
                const callType = call.isVideo ? "Video Call" : "Voice Call";
                const timestamp = moment().tz(timezones || "Africa/Kampala").format("HH:mm:ss");
                
                console.log(`Incoming ${callType} from ${caller} at ${timestamp}`);
                
                // Decline the call first
                await conn.rejectCall(call.id);
                
                // Send notification message
                await conn.sendMessage(caller, {
                    text: `📵 ${global.botname} has call protection enabled!\n\nPlease don't call this number.`,
                });
                
                // Additional actions based on mode
                if (global.anticall === "block") {
                    // Block the caller
                    await conn.updateBlockStatus(caller, "block");
                    console.log(`Blocked ${caller} for attempting a call`);
                    
                    // Notify admin/owner
                    if (global.owner) {
                        await conn.sendMessage(global.owner, {
                            text: `🚫 Blocked ${caller} for attempting a ${callType}\nTime: ${timestamp}`,
                            mentions: [caller]
                        });
                    }
                }
                
                // Log the call attempt
                const logMessage = `⚠️ *Call Blocked*\n\n• Type: ${callType}\n• Caller: @${caller.split('@')[0]}\n• Time: ${timestamp}\n• Action: ${global.anticall === "block" ? "Blocked" : "Declined"}`;
                
                // Send to bot owner if available
                if (global.owner) {
                    await conn.sendMessage(global.owner, {
                        text: logMessage,
                        mentions: [caller]
                    });
                }
                
                
            }
        }
    } catch (error) {
        console.error('Error handling call:', error);
    }
});

  conn.sendButtonImg = async (jid, buttons = [], text, image, footer, quoted = '', options = {}) => {
    const buttonMessage = {
      image: { url: image },
      caption: text,
      footer: footer,
      buttons: buttons.map(button => ({
        buttonId: button.id || '',
        buttonText: { displayText: button.text || 'Button' },
        type: button.type || 1
      })),
      headerType: 1,
      viewOnce: options.viewOnce || false,
    };
    conn.sendMessage(jid, buttonMessage, { quoted });
  };

  conn.sendList = async (jid, title, footer, btn, quoted = '', options = {}) => {
    let msg = generateWAMessageFromContent(jid, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadataVersion: 2,
            deviceListMetadata: {},
          },
          listMessage: {
            title: title,
            description: footer,
            buttonText: btn.buttonText,
            listType: 1,
            sections: btn.sections,
          },
        },
      },
    }, {});
    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
  };

  conn.ev.on('creds.update', saveCreds);

  return conn;
}

module.exports = {
  clientstart,
  loadStoredMessages,
  saveStoredMessage,
  handleAntiEdit,
  handleAntiDelete
};