const Config  = require('./Config ')
const {
  generateWAMessageFromContent,
  proto,
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");
const { exec, spawn, execSync } = require("child_process")
const util = require('util')
const fetch = require('node-fetch')
const path = require('path')
const fs = require('fs');
const axios = require('axios')
const acrcloud = require ('acrcloud');
const FormData = require('form-data');
const cheerio = require('cheerio')
const { performance } = require("perf_hooks");
const process = require('process');
const moment = require("moment-timezone")
const lolcatjs = require('lolcatjs')
const os = require('os');
const speed = require('performance-now')
const yts = require("yt-search")
const jsobfus = require("javascript-obfuscator");
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);
const timestampp = speed();
const latensi = speed() - timestampp
const devmaxtech = '256784407021';
const mainOwner = "256784407021@s.whatsapp.net";
const {
    smsg,
    formatDate,
    getTime,
    getGroupAdmins,
    formatp,
    await,
    sleep,
    isUrl,
    runtime,   
    clockString,
    msToDate,
    sort,
    toNumber,
    enumGetKey,
    fetchJson,
    getBuffer,
    json,
    format,
    logic,
    generateProfilePicture,
    parseMention,
    getRandom,
    fetchBuffer,
    buffergif,
    GIFBufferToVideoBuffer,
    totalcase,
    bytesToSize,
    checkBandwidth,
} = require('./lib/myfunc')

// delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const errorLog = new Map();
const ERROR_EXPIRY_TIME = 60000; // 60 seconds

const recordError = (error) => {
  const now = Date.now();
  errorLog.set(error, now);
  setTimeout(() => errorLog.delete(error), ERROR_EXPIRY_TIME);
};

const shouldLogError = (error) => {
  const now = Date.now();
  if (errorLog.has(error)) {
    const lastLoggedTime = errorLog.get(error);
    if (now - lastLoggedTime < ERROR_EXPIRY_TIME) {
      return false;
    }
  }
  return true;
};

// Images (thumbnails used in menu, etc)
const max1 = fs.readFileSync("./Media/Images/maxtech1.jpg");
const max2 = fs.readFileSync("./Media/Images/maxtech2.jpg");
const max3 = fs.readFileSync("./Media/Images/maxtech3.jpg");
const max4 = fs.readFileSync("./Media/Images/maxtech4.jpg");
const max5 = fs.readFileSync("./Media/Images/maxtech5.jpg");

// Version & keys
const versions = require("./package.json").version;
const dlkey = '_0x5aff35,_0x1876stqr';

// badwords list
const bad = JSON.parse(fs.readFileSync("./src/badwords.json")); 

// Shazam/AcrCloud Config 
const acr = new acrcloud({
    host: 'identify-eu-west-1.acrcloud.com',
    access_key: '882a7ef12dc0dc408f70a2f3f4724340',
    access_secret: 'qVvKAxknV7bUdtxjXS22b5ssvWYxpnVndhy2isXP'
});

// Database (ensure global.db exists)
global.db = global.db || {};
try {
  global.db.data = JSON.parse(fs.readFileSync("./src/database.json"));
} catch (e) {
  global.db.data = global.db.data || {};
}

if (global.db.data) {
  global.db.data = {
    chats: {},
    Config : {},
    blacklist: { blacklisted_numbers: [] }, 
    ...(global.db.data || {}),
  };
}

function jidUser(jid) {
  try {
    if (!jid) return "";
    return String(jid).split('@')[0] || "";
  } catch (e) {
    return "";
  }
}

function detectUserPlatform(msg) {
  try {
    const ctx = msg.msg?.contextInfo || msg.message?.contextInfo || {};
    if (ctx.deviceModel) return String(ctx.deviceModel);
    if (ctx.device) return String(ctx.device);
    if (ctx.platform) return String(ctx.platform);
    if (ctx.userAgent) return String(ctx.userAgent);
    if (msg.pushName && /Android|iPhone|iPad|Web/i.test(msg.pushName)) return msg.pushName;
    if (global.platform) return String(global.platform);
    if (os && os.platform) return String(os.platform());
    return "Unknown";
  } catch (e) {
    return (global.platform || (os && os.platform && os.platform()) || "Unknown");
  }
}

module.exports = Frashr = async (Frashr, m, chatUpdate, store) => {
  try {
    const { type, quotedMsg, mentioned, now, fromMe } = m;

    var body =
      m.message?.protocolMessage?.editedMessage?.conversation || 
      m.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
      m.message?.protocolMessage?.editedMessage?.imageMessage?.caption ||
      m.message?.protocolMessage?.editedMessage?.videoMessage?.caption || 
      m.message?.conversation ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      m.message?.extendedTextMessage?.text ||
      m.message?.buttonsResponseMessage?.selectedButtonId ||
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      m.message?.templateButtonReplyMessage?.selectedId ||
      m.message?.pollCreationMessageV3?.name || 
      m.message?.documentMessage?.caption ||
      m.text || ""; 

    var budy = 
      typeof body === "string" && body.length > 0 
        ? body 
        : typeof m.text === "string" 
          ? m.text 
          : "";

    // prefix   
    const prefix = global.prefixz || "!";

    const isCmd = (typeof body === 'string') && body.startsWith(prefix);
    const trimmedBody = isCmd ? body.slice(prefix.length).trimStart() : "";

    // command
    const command = isCmd && trimmedBody ? trimmedBody.split(/\s+/).shift().toLowerCase() : "";

    const args = trimmedBody.split(/\s+/).slice(1);
    const text = q = args.join(" ");
    const full_args = body.replace(command, '').slice(1).trim();
    const pushname = m.pushName || "No Name";
    const botNumber = await Frashr.decodeJid(Frashr.user.id);
    const sender = m.sender || '';
    const senderNumber = jidUser(sender);
    const isCreator = [botNumber, devmaxtech, global.ownernumber, ...(global.sudo || [])]
          .map((v) => (v || "").toString().replace(/[^0-9]/g, "") + "@s.whatsapp.net")
          .includes(m.sender);
    const itsMe = m.sender == botNumber ? true : false;
    const from = m.key?.remoteJid || '';
    const quotedMessage = m.quoted || m;
    const quoted =
      quotedMessage?.mtype === "buttonsMessage"
        ? quotedMessage[Object.keys(quotedMessage)[1]]
        : quotedMessage?.mtype === "templateMessage" && quotedMessage.hydratedTemplate
        ? quotedMessage.hydratedTemplate[Object.keys(quotedMessage.hydratedTemplate)[1]]
        : quotedMessage?.mtype === "product"
        ? quotedMessage[Object.keys(quotedMessage)[0]]
        : m.quoted || m;
    const mime = quoted?.msg?.mimetype || quoted?.mimetype || "";

    // Group Metadata
    const groupMetadata = m.isGroup
      ? await Frashr.groupMetadata(m.chat).catch((e) => {
          console.error('Error fetching group metadata:', e);
          return null;
        })
      : null;

    const groupName = m.isGroup && groupMetadata ? groupMetadata.subject : "";
    const participants = m.isGroup && groupMetadata ? groupMetadata.participants : [];
    const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : [];
    const isGroupAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;
    const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false;
    const isBot = botNumber.includes(senderNumber);
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;
    const groupOwner = m.isGroup && groupMetadata ? groupMetadata.owner : "";
    const isGroupOwner = m.isGroup
      ? (groupOwner ? groupOwner : groupAdmins).includes(m.sender)
      : false;


    // Function to fetch MP3 download URL (tries two APIs)
    async function fetchMp3DownloadUrl(link) {
      const fetchDownloadUrl1 = async (videoUrl) => {
        const apiUrl = `https://api.giftedtech.my.id/api/download/dlmp3?apikey=${dlkey}&url=${videoUrl}`;
        const response = await axios.get(apiUrl);
        if (response.status !== 200 || !response.data.success) {
          throw new Error('Failed to fetch from GiftedTech API');
        }
        return response.data.result.download_url;
      };

      const fetchDownloadUrl2 = async (videoUrl) => {
        const format = 'mp3';
        const url = `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(videoUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        if (!response.data || !response.data.success) throw new Error('Failed to fetch from API2');

        const { id } = response.data;
        while (true) {
          const progress = await axios.get(`https://p.oceansaver.in/ajax/progress.php?id=${id}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          if (progress.data && progress.data.success && progress.data.progress === 1000) {
            return progress.data.download_url;
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      };

      try {
        let downloadUrl;
        try {
          downloadUrl = await fetchDownloadUrl1(link);
        } catch (error) {
          console.log('Falling back to second API...');
          downloadUrl = await fetchDownloadUrl2(link);
        }
        return downloadUrl;
      } catch (error) {
        throw error;
      }
    }

    async function fetchVideoDownloadUrl(link) {
      const apiUrl = `https://api.giftedtech.my.id/api/download/dlmp4?apikey=${dlkey}&url=${encodeURIComponent(link)}`;
      const response = await axios.get(apiUrl);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to retrieve the video!');
      }
      return response.data.result;
    }

    async function saveStatusMessage(m) {
      try {
        if (!m.quoted || m.quoted.chat !== 'status@broadcast') {
          return m.reply('*Please reply to a status message!*');
        }
        await m.quoted.copyNForward(m.chat, true);
        Frashr.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      } catch (error) {
        console.error('Failed to save status message:', error);
        m.reply(`Error: ${error.message}`);
      }
    }

    async function ephoto(url, texk) {
      let form = new FormData();
      let gT = await axios.get(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
        },
      });
      let $ = cheerio.load(gT.data);
      let text = texk;
      let token = $("input[name=token]").val();
      let build_server = $("input[name=build_server]").val();
      let build_server_id = $("input[name=build_server_id]").val();
      form.append("text[]", text);
      form.append("token", token);
      form.append("build_server", build_server);
      form.append("build_server_id", build_server_id);
      let res = await axios({
        url: url,
        method: "POST",
        data: form,
        headers: {
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
          cookie: gT.headers["set-cookie"]?.join("; "),
          "Content-Type": "multipart/form-data",
        },
      });
      let $$ = cheerio.load(res.data);
      let json = JSON.parse($$("input[name=form_value_input]").val());
      json["text[]"] = json.text;
      delete json.text;
      let { data } = await axios.post(
        "https://en.ephoto360.com/effect/create-image",
        new URLSearchParams(json),
        {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
            cookie: gT.headers["set-cookie"].join("; "),
          },
        }
      );
      return build_server + data.image;
    }

    // obfuscator 
    async function obfus(query) {
      return new Promise((resolve, reject) => {
        try {
          const obfuscationResult = jsobfus.obfuscate(query, {
            compact: false,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1,
          });
          const result = {
            status: 200,
            author: `${ownername}`,
            result: obfuscationResult.getObfuscatedCode(),
          };
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }

    const pickRandom = (arr) => {
      return arr[Math.floor(Math.random() * arr.length)]
    }

    // TAKE PP USER (profile picture fetch)
    let ppuser;
    try {
      ppuser = await Frashr.profilePictureUrl(m.sender, 'image');
    } catch (err) {
      ppuser = 'https://telegra.ph/file/6880771a42bad09dd6087.jpg';
    }
    let ppnyauser = await getBuffer(ppuser)
    let ppUrl = await Frashr.profilePictureUrl(m.sender, 'image').catch(_ => 'https://telegra.ph/file/6880771a42bad09dd6087.jpg')

    // ================== [ DATABASE DEFAULTS ] ==================//
    try {
      if (from.endsWith('@g.us')) { 
        let chats = global.db.data.chats[from];
        if (typeof chats !== "object") global.db.data.chats[from] = {};
        chats = global.db.data.chats[from]; 
        if (!("antibot" in chats)) chats.antibot = false;
        if (!("antilink" in chats)) chats.antilink = false;
        if (!("badword" in chats)) chats.badword = false; 
        if (!("antilinkgc" in chats)) chats.antilinkgc = false;
        if (!("antilinkkick" in chats)) chats.antilinkkick = false;
        if (!("badwordkick" in chats)) chats.badwordkick = false; 
        if (!("antilinkgckick" in chats)) chats.antilinkgckick = false;
      }

      let setting = global.db.data.Config [botNumber];
      if (typeof setting !== "object") global.db.data.Config [botNumber] = {};
      setting = global.db.data.Config [botNumber]; 
      if (!("autobio" in setting)) setting.autobio = false;
      if (!("autotype" in setting)) setting.autotype = false;
      if (!("autoread" in setting)) setting.autoread = false; 
      if (!("autorecord" in setting)) setting.autorecord = false; 
      if (!("autorecordtype" in setting)) setting.autorecordtype = false;

      let blacklist = global.db.data.blacklist;
      if (!blacklist || typeof blacklist !== "object") global.db.data.blacklist = { blacklisted_numbers: [] };

    } catch (err) {
      console.error("Error initializing database:", err);
    }

    // ================== [ CONSOLE LOG ] ==================//
    const dayz = moment(Date.now()).tz(`${timezones}`).locale('en').format('dddd');
    const timez = moment(Date.now()).tz(`${timezones}`).locale('en').format('HH:mm:ss z');
    const datez = moment(Date.now()).tz(`${timezones}`).format("DD/MM/YYYY");

    if (m.message) {
      lolcatjs.fromString(`┏━━━━━━━━━━━━━『 FLASH_MD 』━━━━━━━━━━━━━─`);
      lolcatjs.fromString(`» Sent Time: ${dayz}, ${timez}`);
      lolcatjs.fromString(`» Message Type: ${m.mtype}`);
      lolcatjs.fromString(`» Sender Name: ${pushname || 'N/A'}`);
      lolcatjs.fromString(`» Chat ID: ${jidUser(m.chat) || 'N/A'}`);
      lolcatjs.fromString(`» Message: ${budy || 'N/A'}`);
      lolcatjs.fromString('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─ ⳹\n\n');
    }

    // auto set bio
    if (db.data.Config [botNumber].autobio) {
      let xdpy = moment(Date.now()).tz(`${timezones}`).locale('en').format('dddd');
      let xtipe = moment(Date.now()).tz(`${timezones}`).locale('en').format('HH:mm z');
      let xdpte = moment(Date.now()).tz(`${timezones}`).format("DD/MM/YYYY");

      Frashr.updateProfileStatus(
        `${xtipe}, ${xdpy}; ${xdpte}:- ${botname}`
      ).catch((_) => _);
    }

    // auto type/record presence toggles
    if (db.data.Config [botNumber].autorecordtype) {
      if (m.message) {
        let XpBotmix = ["composing", "recording"];
        XpBotmix2 = XpBotmix[Math.floor(XpBotmix.length * Math.random())];
        Frashr.sendPresenceUpdate(XpBotmix2, from);
      }
    }
    if (db.data.Config [botNumber].autorecord) {
      if (m.message) {
        let XpBotmix = ["recording"];
        XpBotmix2 = XpBotmix[Math.floor(XpBotmix.length * Math.random())];
        Frashr.sendPresenceUpdate(XpBotmix2, from);
      }
    }
    if (db.data.Config [botNumber].autotype) {
      if (m.message) {
        let XpBotpos = ["composing"];
        Frashr.sendPresenceUpdate(XpBotpos, from);
      }
    }   

    // antibot enforcement in groups
    if (from.endsWith('@g.us') && db.data.chats[m.chat].antibot) {
      if (m.isBaileys && (!isAdmins || !isCreator || isBotAdmins )) {
        m.reply(`*BOT DETECTED*\n\nGo away!`);
        await Frashr.groupParticipantsUpdate(
          m.chat,
          [m.sender],
          "remove"
        );
      }
    }

    // antilinkgc handling
    if (from.endsWith('@g.us') && db.data.chats[m.chat].antilinkgc) {
      const groupLinkRegex = /(?:https?:\/\/)?chat\.whatsapp\.com\/\S+/i; 

      if (m.message && groupLinkRegex.test(budy)) {
        if (isAdmins || isCreator || !isBotAdmins) return; 

        await Frashr.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant,
          },
        });
      }
    }

    // antilinkgckick handling
    if (from.endsWith('@g.us') && db.data.chats[m.chat].antilinkgckick) {
      const groupLinkRegex = /(?:https?:\/\/)?chat\.whatsapp\.com\/\S+/i; 
      
      if (m.message && groupLinkRegex.test(budy)) {
        if (isAdmins || isCreator || !isBotAdmins) return;
        {
          if (isAdmins || isCreator || !isBotAdmins) return;
          await Frashr.sendMessage(m.chat, {
            delete: {
              remoteJid: m.chat,
              fromMe: false,
              id: m.key.id,
              participant: m.key.participant,
            },
          });
          Frashr.sendMessage(
            from,
            {
              text: `GROUP LINK DETECTED\n\n@${jidUser(m.sender)} *Beware, group links are not allowed in this group!*`,
              contextInfo: { mentionedJid: [m.sender] },
            },
            { quoted: m }
          );
          await Frashr.groupParticipantsUpdate(
            m.chat,
            [m.sender],
            "remove"
          );
        }
      }
    }

    // antilink handling (generic)
    if (from.endsWith('@g.us') && db.data.chats[m.chat].antilink) {
      const linkRegex = /(?:https?:\/\/|www\.|t\.me\/|bit\.ly\/|tinyurl\.com\/|(?:[a-z0-9]+\.)+[a-z]{2,})(\/\S*)?/i;

      const messageContent = 
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        m.message?.pollCreationMessageV3?.name ||
        m.message?.protocolMessage?.editedMessage?.conversation ||
        m.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
        m.message?.protocolMessage?.editedMessage?.imageMessage?.caption ||
        m.message?.protocolMessage?.editedMessage?.videoMessage?.caption ||
        m.message?.protocolMessage?.editedMessage || 
        pollMessageData; 

      if (messageContent && linkRegex.test(messageContent)) {
        if (isAdmins || isCreator || !isBotAdmins) return; 

        await Frashr.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant,
          },
        });
      }
    }

    // antilinkkick handling (kick on link)
    if (from.endsWith('@g.us') && db.data.chats[m.chat].antilinkkick) {
      const linkRegex = /(?:https?:\/\/|www\.|t\.me\/|bit\.ly\/|tinyurl\.com\/|(?:[a-z0-9]+\.)+[a-z]{2,})(\/\S*)?/i;

      if (m.message && linkRegex.test(budy)) {
        if (isAdmins || isCreator || !isBotAdmins) return; 
      
        await Frashr.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant,
          },
        });
        await Frashr.sendMessage(
          from,
          {
            text: `LINK DETECTED\n\n@${jidUser(m.sender)} *Beware, links are not allowed in this group!*`,
            contextInfo: { mentionedJid: [m.sender] },
          },
          { quoted: m }
        );
        await Frashr.groupParticipantsUpdate(
          m.chat,
          [m.sender],
          "remove"
        );
      }
    }

    // Anti Bad Words
    if (from.endsWith('@g.us') && db.data.chats[m.chat].badword) {
      for (let bak of bad) {
        let regex = new RegExp(`\\b${bak}\\b`, 'i'); 
        if (regex.test(budy)) {
          if (isAdmins || isCreator || !isBotAdmins) return; 
          
          await Frashr.sendMessage(m.chat, {
            delete: {
              remoteJid: m.chat,
              fromMe: false,
              id: m.key.id,
              participant: m.key.participant,
            },
          });

          await Frashr.sendMessage(
            from,
            {
              text: `BAD WORD DETECTED\n\n@${jidUser(m.sender)} *Beware, using bad words is prohibited in this group!*`,
              contextInfo: { mentionedJid: [m.sender] },
            },
            { quoted: m }
          );
          break;
        }
      }
    }

    // Bad words with kick
    if (from.endsWith('@g.us') && db.data.chats[m.chat].badwordkick) {
      for (let bak of bad) {
        let regex = new RegExp(`\\b${bak}\\b`, 'i'); 
        if (regex.test(budy)) {
          if (isAdmins || isCreator || !isBotAdmins) return; 
          
          await Frashr.sendMessage(m.chat, {
            delete: {
              remoteJid: m.chat,
              fromMe: false,
              id: m.key.id,
              participant: m.key.participant,
            },
          });

          await Frashr.sendMessage(
            from,
            {
              text: `BAD WORD DETECTED\n\n@${jidUser(m.sender)} *You have been removed for using prohibited language!*`,
              contextInfo: { mentionedJid: [m.sender] },
            },
            { quoted: m }
          );

          await Frashr.groupParticipantsUpdate(
            m.chat,
            [m.sender],
            "remove"
          );
          break; 
        }
      }
    }

    // load stored messages helper used by antidelete/antiedit
    const storeFile = "./src/store.json";
    function loadStoredMessages() {
      if (fs.existsSync(storeFile)) {
        try {
          return JSON.parse(fs.readFileSync(storeFile));
        } catch (err) {
          console.error("❌ Error reading store.json:", err);
          return {};
        }
      }
      return {};
    }

    // Antidelete (private) - recover deleted media/text and forward/send with contextInfo
    if (
      global.antidelete === 'private' &&
      m.message?.protocolMessage?.type === 0 && 
      m.message?.protocolMessage?.key
    ) {
      try {
        // If the actor who deleted is a creator, skip reporting
        if (isCreator) return;

        let messageId = m.message.protocolMessage.key.id;
        let chatId = m.chat;
        let deletedBy = m.sender;

        let storedMessages = loadStoredMessages();
        let deletedMsg = storedMessages[chatId]?.[messageId];

        if (!deletedMsg) {
          console.log("⚠️ Deleted message not found in database.");
        } else {
          let sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;

          // If it's media (no conversation or extendedTextMessage), forward only the media with contextInfo
          if (!deletedMsg.message.conversation && !deletedMsg.message.extendedTextMessage) {
            try {
              await Frashr.sendMessage(
                Frashr.user.id,
                {
                  forward: deletedMsg,
                  contextInfo: {
                    isForwarded: false,
                    mentionedJid: [sender, deletedBy],
                    externalAdReply: {
                      title: 'Deleted Message',
                      body: 'Deleted by',
                      thumbnailUrl: ppUrl,
                      sourceUrl: 'https://www.youtube.com/@Terrizev',
                      mediaType: 1,
                      renderLargerThumbnail: false
                    }
                  }
                },
                { quoted: deletedMsg }
              );
            } catch (mediaErr) {
              console.error("Media forward failed:", mediaErr);
            }
          } else {
            // For deleted text, send the text content with contextInfo (mentions + externalAdReply)
            try {
              let text = deletedMsg.message.conversation || deletedMsg.message.extendedTextMessage?.text || '';
              let quotedMessage = {
                key: {
                  remoteJid: chatId,
                  fromMe: sender === Frashr.user.id,
                  id: messageId,
                  participant: sender
                },
                message: {
                  conversation: text
                }
              };

              await Frashr.sendMessage(
                Frashr.user.id,
                {
                  text: text || '[Deleted text]',
                  mentions: [sender, deletedBy],
                  contextInfo: {
                    mentionedJid: [sender, deletedBy],
                    externalAdReply: {
                      title: 'Deleted Message',
                      body: 'Deleted by',
                      thumbnailUrl: ppUrl,
                      sourceUrl: 'https://www.youtube.com/@Terrizev',
                      mediaType: 1,
                      renderLargerThumbnail: false
                    }
                  }
                },
                { quoted: quotedMessage }
              );
            } catch (textErr) {
              console.error("Failed to send deleted text:", textErr);
            }
          }
        }
      } catch (err) {
        console.error("❌ Error processing deleted message:", err);
      }
    } else if (
      m.sender !== botNumber &&
      global.antidelete === 'chat' &&
      m.message?.protocolMessage?.type === 0 && 
      m.message?.protocolMessage?.key
    ) {
      try {
        // If the actor who deleted is a creator, skip reporting
        if (isCreator) return;

        let messageId = m.message.protocolMessage.key.id;
        let chatId = m.chat;
        let deletedBy = m.sender;

        let storedMessages = loadStoredMessages();
        let deletedMsg = storedMessages[chatId]?.[messageId];

        if (!deletedMsg) {
          console.log("⚠️ Deleted message not found in database.");
        } else {
          let sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;

          // If media, forward the media to the same chat with contextInfo
          if (!deletedMsg.message.conversation && !deletedMsg.message.extendedTextMessage) {
            try {
              await Frashr.sendMessage(
                m.chat,
                {
                  forward: deletedMsg,
                  contextInfo: {
                    isForwarded: false,
                    mentionedJid: [sender, deletedBy],
                    externalAdReply: {
                      title: 'Deleted Message',
                      body: 'Deleted by',
                      thumbnailUrl: ppUrl,
                      sourceUrl: 'https://www.youtube.com/@Terrizev',
                      mediaType: 1,
                      renderLargerThumbnail: false
                    }
                  }
                },
                { quoted: deletedMsg }
              );
            } catch (mediaErr) {
              console.error("Media forward failed:", mediaErr);
            }
          } else {
            // For deleted text, send the text content with contextInfo
            try {
              let text = deletedMsg.message.conversation || deletedMsg.message.extendedTextMessage?.text || '';
              let quotedMessage = {
                key: {
                  remoteJid: chatId,
                  fromMe: sender === Frashr.user.id,
                  id: messageId,
                  participant: sender
                },
                message: {
                  conversation: text
                }
              };

              await Frashr.sendMessage(
                m.chat,
                {
                  text: text || '[Deleted text]',
                  mentions: [sender, deletedBy],
                  contextInfo: {
                    mentionedJid: [sender, deletedBy],
                    externalAdReply: {
                      title: 'Deleted Message',
                      body: 'Deleted by',
                      thumbnailUrl: ppUrl,
                      sourceUrl: 'https://www.youtube.com/@Terrizev',
                      mediaType: 1,
                      renderLargerThumbnail: false
                    }
                  }
                },
                { quoted: quotedMessage }
              );
            } catch (textErr) {
              console.error("Failed to send deleted text:", textErr);
            }
          }
        }
      } catch (err) {
        console.error("❌ Error processing deleted message:", err);
      }
    }

    // antiedit handling (private/chat) - send original and edited text with contextInfo; skip when editor is creator
    if (
      global.antiedit === 'private' &&
      (m.message?.protocolMessage?.editedMessage?.conversation || 
      m.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text)
    ) {
      try {
        // If editor is a creator, skip reporting
        if (isCreator) return;

        let messageId = m.message.protocolMessage.key.id;
        let chatId = m.chat;
        let editedBy = m.sender;

        let storedMessages = loadStoredMessages();
        let originalMsg = storedMessages[chatId]?.[messageId];

        if (!originalMsg) {
          console.log("⚠️ Original message not found in store.json.");
        } else {
          let sender = originalMsg.sender || originalMsg.key?.participant || originalMsg.key?.remoteJid;
          let chatName = chatId.endsWith("@g.us") ? "(Group Chat)" : "(Private Chat)";

          let xtipes = moment(originalMsg.timestamp * 1000).tz(`${timezones}`).locale('en').format('HH:mm z');
          let xdptes = moment(originalMsg.timestamp * 1000).tz(`${timezones}`).format("DD/MM/YYYY");

          const originalText = originalMsg.text || originalMsg.message?.conversation || originalMsg.message?.extendedTextMessage?.text || '[Original message unavailable]';
          const editedText = m.message.protocolMessage?.editedMessage?.conversation || m.message.protocolMessage?.editedMessage?.extendedTextMessage?.text || '[Edited message unavailable]';

          let quotedMessage = {
            key: {
              remoteJid: chatId,
              fromMe: sender === Frashr.user.id,
              id: messageId,
              participant: sender
            },
            message: {
              conversation: originalText 
            }
          };

          // send original text with contextInfo
          await Frashr.sendMessage(
            Frashr.user.id,
            {
              text: `🔁 Edited Message (Original):\n\n${originalText}`,
              mentions: [sender, editedBy],
              contextInfo: {
                mentionedJid: [sender, editedBy],
                externalAdReply: {
                  title: 'Edited Message',
                  body: 'Edited by',
                  thumbnailUrl: ppUrl,
                  sourceUrl: 'https://www.youtube.com/@Terrizev',
                  mediaType: 1,
                  renderLargerThumbnail: false
                }
              }
            },
            { quoted: quotedMessage }
          );

          // send edited text with contextInfo
          await Frashr.sendMessage(
            Frashr.user.id,
            {
              text: `✏️ Edited Message (New):\n\n${editedText}`,
              mentions: [sender, editedBy],
              contextInfo: {
                mentionedJid: [sender, editedBy],
                externalAdReply: {
                  title: 'Edited Message',
                  body: 'Edited by',
                  thumbnailUrl: ppUrl,
                  sourceUrl: 'https://www.youtube.com/@Terrizev',
                  mediaType: 1,
                  renderLargerThumbnail: false
                }
              }
            },
            { quoted: quotedMessage }
          );
        }
      } catch (err) {
        console.error("❌ Error processing edited message:", err);
      }
    } else if (
      global.antiedit === 'chat' &&
      (m.message?.protocolMessage?.editedMessage?.conversation || 
      m.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text)
    ) {
      try {
        // If editor is a creator, skip reporting
        if (isCreator) return;

        let messageId = m.message.protocolMessage.key.id;
        let chatId = m.chat;
        let editedBy = m.sender;

        let storedMessages = loadStoredMessages();
        let originalMsg = storedMessages[chatId]?.[messageId];

        if (!originalMsg) {
          console.log("⚠️ Original message not found in store.json.");
        } else {
          let sender = originalMsg.sender || originalMsg.key?.participant || originalMsg.key?.remoteJid;
          let chatName = chatId.endsWith("@g.us") ? "(Group Chat)" : "(Private Chat)";

          let xtipes = moment(originalMsg.timestamp * 1000).tz(`${timezones}`).locale('en').format('HH:mm z');
          let xdptes = moment(originalMsg.timestamp * 1000).tz(`${timezones}`).format("DD/MM/YYYY");

          const originalText = originalMsg.text || originalMsg.message?.conversation || originalMsg.message?.extendedTextMessage?.text || '[Original message unavailable]';
          const editedText = m.message.protocolMessage?.editedMessage?.conversation || m.message.protocolMessage?.editedMessage?.extendedTextMessage?.text || '[Edited message unavailable]';

          let quotedMessage = {
            key: {
              remoteJid: chatId,
              fromMe: sender === Frashr.user.id,
              id: messageId,
              participant: sender
            },
            message: {
              conversation: originalText 
            }
          };

          // send original text with contextInfo to the chat
          await Frashr.sendMessage(
            m.chat,
            {
              text: `🔁 Edited Message (Original):\n\n${originalText}`,
              mentions: [sender, editedBy],
              contextInfo: {
                mentionedJid: [sender, editedBy],
                externalAdReply: {
                  title: 'Edited Message',
                  body: 'Edited by',
                  thumbnailUrl: ppUrl,
                  sourceUrl: 'https://www.youtube.com/@Terrizev',
                  mediaType: 1,
                  renderLargerThumbnail: false
                }
              }
            },
            { quoted: quotedMessage }
          );

          // send edited text with contextInfo to the chat
          await Frashr.sendMessage(
            m.chat,
            {
              text: `✏️ Edited Message (New):\n\n${editedText}`,
              mentions: [sender, editedBy],
              contextInfo: {
                mentionedJid: [sender, editedBy],
                externalAdReply: {
                  title: 'Edited Message',
                  body: 'Edited by',
                  thumbnailUrl: ppUrl,
                  sourceUrl: 'https://www.youtube.com/@Terrizev',
                  mediaType: 1,
                  renderLargerThumbnail: false
                }
              }
            },
            { quoted: quotedMessage }
          );
        }
      } catch (err) {
        console.error("❌ Error processing edited message:", err);
      }
    }

    // Presence handling: alwaysonline setting now checked in-memory
    if (global.alwaysonline === 'false') {
      if (m.message) {
        try {
          await Frashr.sendPresenceUpdate("unavailable", from);
          await delay(1000); // 1-second delay
        } catch (error) {
          console.error('Error sending unavailable presence update:', error);
        }
      }
    } else if (global.alwaysonline === 'true') {
      if (m.message) {
        try {
          await Frashr.sendPresenceUpdate("available", from);
          await delay(1000); // 1-second delay
        } catch (error) {
          console.error('Error sending available presence update:', error);
        }
      }
    }

    // autoread (in-memory)
    if (global.autoread === 'true' || db.data.Config [botNumber].autoread) {
      try { Frashr.readMessages([m.key]); } catch (e) {}
    }

    // Quick media-forward feature triggered by emojis + creator privileges
    if (
      m.quoted &&
      (m.quoted.viewOnce || m.msg?.contextInfo?.quotedMessage) &&
      (m.message?.conversation || m.message?.extendedTextMessage) &&
      isCreator &&
      ['🌚', '😂', '🥲', '🤔', '🤭', '🍆', '🥵', '🫂', '😳'].some((emoji) => m.body.startsWith(emoji))
    ) {
      (async () => {
        try {
          let msg = m.msg?.contextInfo?.quotedMessage;
          if (!msg) return console.log('Quoted message not found.');

          let type = Object.keys(msg)[0];
          if (!type || !/image|video/.test(type)) {
            console.log('*Invalid media type!*');
            return;
          }

          const media = await downloadContentFromMessage(
            msg[type],
            type === 'imageMessage' ? 'image' : 'video'
          );

          const bufferArray = [];
          for await (const chunk of media) {
            bufferArray.push(chunk);
          }

          const buffer = Buffer.concat(bufferArray);

          await Frashr.sendMessage(
            Frashr.user.id,
            type === 'videoMessage'
              ? { video: buffer, caption: global.wm }
              : { image: buffer, caption: global.wm },
            { quoted: m }
          );
          
          bufferArray.length = 0; 
          buffer.fill(0);
          msg = null;

        } catch (err) {
          console.error('Error processing media:', err);
        }
      })();
    } else if (
       m.message &&
       m.message.extendedTextMessage?.contextInfo?.quotedMessage &&
        !command &&
        isCreator &&
        m.quoted.chat === 'status@broadcast'
    ) {
      try {
        await m.quoted.copyNForward(Frashr.user.id, true);
      } catch (err) {
        console.error('Error forwarding status:', err);
      }
    }

    // Chatbot behavior (in-memory flag global.chatbot)
    if (
      global.chatbot && global.chatbot === 'true' && 
      (m.message.extendedTextMessage?.text || m.message.conversation) && 
      !isCreator && !m.isGroup && !command
    ) {
      try {
        const userId = m.sender; 
        const userMessage = m.message.extendedTextMessage?.text || m.message.conversation || ''; 

        if (!userMessage.trim()) {
          return; 
        }

        await Frashr.sendPresenceUpdate('composing', m.chat);

        const callFallbackAPI = async () => {
            const apiUrl = `https://bk9.fun/ai/GPT4o`;
            const params = { q: userMessage.trim(), userId: userId };
            return axios.get(apiUrl, { params });
        };

        const callPrimaryAPI = async () => {
            const apiUrl = `https://bk9.fun/ai/Llama3`;
            const params = { q: userMessage.trim(), userId: userId };
            return axios.get(apiUrl, { params });
        };

        try {
            const response = await callPrimaryAPI();
            const botResponse = response.data?.BK9;
            if (botResponse) {
                await Frashr.sendMessage(m.chat, { text: `${botResponse}` }, { quoted: m });
            }
        } catch (primaryError) {
            console.error('Primary API request failed:', primaryError);
            try {
                const response = await callFallbackAPI();
                const botResponse = response.data?.BK9;
                if (botResponse) {
                    await Frashr.sendMessage(m.chat, { text: `${botResponse}` }, { quoted: m });
                }
            } catch (fallbackError) {
                console.error('Fallback API request failed:', fallbackError); 
            }
        }
      } catch (err) {
        console.error('Error processing chatbot request:', err);
      }
    }

    // Blacklist enforcement (in-memory DB)
    function loadBlacklist() {
      if (!global.db.data.blacklist) {
        global.db.data.blacklist = { blacklisted_numbers: [] };
      }
      return global.db.data.blacklist;
    }

    const chatId = m.chat;
    const userId = m.key.remoteJid;
    const blacklist = loadBlacklist();

    if ((blacklist.blacklisted_numbers.includes(userId) || blacklist.blacklisted_numbers.includes(chatId)) 
        && userId !== botNumber && !m.key.fromMe) {
      return;
    }

    // small whitelists (developer)
    if (["120363321302359713@g.us", "120363381188104117@g.us"].includes(m.chat)) {  
      if (command && !isCreator && !m.key.fromMe) {
        return;
      }
    }

    // Mode enforcement (uses in-memory global.mode)
    if (global.mode === 'private') {
      if (command && !isCreator && !m.key.fromMe) return;
    } else if (global.mode === 'group') {
      if (command && !m.isGroup && !isCreator && !m.key.fromMe) return;
    } else if (global.mode === 'pm') {
      if (command && m.isGroup && !isCreator && !m.key.fromMe) return;
    }

    // modeStatus computed for menu or status messages
    const modeStatus = 
      global.mode === 'public' ? "Public" : 
      global.mode === 'private' ? "Private" : 
      global.mode === 'group' ? "Group Only" : 
      global.mode === 'pm' ? "PM Only" : "Unknown";

    // ================== [ FAKE REPLY HELPERS ] ==================//
    const fkontak = {
      key: {
        participants: "0@s.whatsapp.net",
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "Halo"},
      message: {
        contactMessage: {
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${jidUser(m.sender)}:${jidUser(m.sender)}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }},
      participant: "0@s.whatsapp.net"
    }

    const reply = async(teks) => {
      Frashr.sendMessage(m.chat, {
        text: teks,
        contextInfo: {
          forwardingScore: 9999999,
          isForwarded: true
        }
      }, { quoted: m });
    }
       
    const replys = async(teks) => {
      m.reply(teks);
    }

    const reply2 = async(teks) => { 
      Frashr.sendMessage(m.chat, { text : teks,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 9999, 
        isForwarded: true, 
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363400964601488@newsletter',
          newsletterName: '𝙑𝙀𝙄𝙒 𝘾𝙃𝘼𝙉𝙉𝙀𝙇'
        },
        externalAdReply: {
          title: "FLASH_MD", 
          body: "",
          thumbnailUrl: "https://files.catbox.moe/zy5l2q.jpeg", 
          sourceUrl: null,
          mediaType: 1
        }}}, { quoted : m })
    }

    // plugin execution context: removed Heroku functions - Config  are in-memory
    const { pluginManager } = require('./index');
    (async () => {
      const context = {
        Frashr, 
        m,        
        reply, 
        args,  
        quoted,
        mime,
        prefix,    
        command,
        text,    
        bad,   
        isCreator, 
        mess, 
        db,       
        botNumber, 
        modeStatus, 
        sleep,     
        isUrl,   
        versions, 
        full_args,
        from,
        isAdmins,
        isBotAdmins,
        isGroupOwner,
        participants,
        q,
        store,
        sender,
        botname,
        ownername,
        ownernumber,
        fetchMp3DownloadUrl,
        fetchVideoDownloadUrl,
        saveStatusMessage,
        groupMetadata,
        fetchJson,
        acr,
        obfus,
        pushname,
        ephoto,
        loadBlacklist,
        mainOwner,
      };

      // Process commands via pluginManager
      if (command) {
        try {
          const handled = await pluginManager.executePlugin(context, command);
        } catch (error) {
          console.error('Error executing command:', error.message);
          Frashr.sendMessage(Frashr.user.id, { text: `An error occurred while executing the command: ${error.message}` });
        }
      }
    })();

    switch (command) {
      case "menu": {
        const os = require("os");
        const fs = require("fs");
        const path = require("path");
        const { performance } = require("perf_hooks");

        function toSmallCaps(input = "") {
          const map = {
            a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ",
            i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
            q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
            y: "ʏ", z: "ᴢ",
            A: "ᴀ", B: "ʙ", C: "ᴄ", D: "ᴅ", E: "ᴇ", F: "ꜰ", G: "ɢ", H: "ʜ",
            I: "ɪ", J: "ᴊ", K: "ᴋ", L: "ʟ", M: "ᴍ", N: "ɴ", O: "ᴏ", P: "ᴘ",
            Q: "ǫ", R: "ʀ", S: "s", T: "ᴛ", U: "ᴜ", V: "ᴠ", W: "ᴡ", X: "x",
            Y: "ʏ", Z: "ᴢ",
            "0": "0","1": "1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
            " ": " ", "-": "-", "_":"_"
          };
          return input.split("").map(ch => map[ch] || ch).join("");
        }

        function detectUserPlatform(msg) {
          try {
            const ctx = msg.msg?.contextInfo || msg.message?.contextInfo || {};
            if (ctx.deviceModel) return String(ctx.deviceModel);
            if (ctx.device) return String(ctx.device);
            if (ctx.platform) return String(ctx.platform);
            if (ctx.userAgent) return String(ctx.userAgent);
            if (msg.pushName && /Android|iPhone|iPad|Web/i.test(msg.pushName)) return msg.pushName;
            if (global.platform) return String(global.platform);
            if (os && os.platform) return String(os.platform());
            return "Unknown";
          } catch (e) {
            return (global.platform || (os && os.platform && os.platform()) || "Unknown");
          }
        }

        function formatRam(used, total) {
          return `${Math.round(used / 1024 / 1024)}/${Math.round(total / 1024 / 1024)}MB`;
        }
        function formatUptime(seconds) {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = Math.floor(seconds % 60);
          return `${h}h ${m}m ${s}s`;
        }
        function getTimeString() {
          const now = new Date();
          let hour = now.getHours();
          const minute = now.getMinutes().toString().padStart(2, '0');
          const ampm = hour >= 12 ? 'PM' : 'AM';
          hour = hour % 12 || 12;
          return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
        }
        function getDateInfo() {
          const now = new Date();
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const day = days[now.getDay()];
          const date = now.getDate();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();
          return { day, dateStr: `${date}/${month}/${year}` };
        }

        const loadMenuPlugins = (directory) => {
          const plugins = {};
          if (!fs.existsSync(directory)) return plugins;
          const files = fs.readdirSync(directory);
          files.forEach(file => {
            if (file.endsWith('.js')) {
              const filePath = path.join(directory, file);
              try {
                delete require.cache[require.resolve(filePath)];
                const pluginArray = require(filePath);
                const category = path.basename(file, '.js');
                if (!plugins[category]) plugins[category] = [];
                plugins[category].push(...pluginArray);
              } catch (error) {
                console.error(`Error loading plugin at ${filePath}:`, error);
              }
            }
          });
          return plugins;
        };

        const generateMenu = (plugins, ownername, prefixz, modeStatus, versions, latensie, readmoreText, username, uptimeSeconds, platform = "Linux aws", botname = "FLASH_MD") => {
          const memoryUsage = process.memoryUsage();
          const botUsedMemory = memoryUsage.heapUsed;
          const totalMemory = os.totalmem();

          // Count unique commands
          const uniqueCommands = new Set();
          for (const category in plugins) {
            plugins[category].forEach(plugin => {
              if (plugin.command && plugin.command.length > 0) {
                uniqueCommands.add(plugin.command[0]);
              }
            });
          }

          const { day, dateStr } = getDateInfo();
          const timeStr = getTimeString();
          const uptimeStr = formatUptime(uptimeSeconds || process.uptime());

          let menu = `\`\`\`╭═══ ${botname.toUpperCase()} ═══⊷
╭────────────
┃々│ Prefix : ${prefixz}
┃々│ User : ${username}
┃々│ Time : ${timeStr}
┃々│ Day : ${day}
┃々│ Date : ${dateStr}
┃々│ Version : ${versions}
┃々│ Plugins : ${uniqueCommands.size}
┃々│ Ram : ${formatRam(botUsedMemory, totalMemory)}
┃々│ Uptime : ${uptimeStr}
┃々│ Platform : ${platform}
┃々│ mode : ${modeStatus}
┃  ╰────────────
╰═════════════════⊷\`\`\`\n`;

          if (readmoreText) menu += readmoreText + "\n";

          for (const category in plugins) {
            const catHead = category.replace(/_/g, ' ').toUpperCase();
            menu += `╭─❏ ${catHead} ❏\n`;
            plugins[category].forEach(plugin => {
              if (plugin.command && plugin.command.length > 0) {
                const cmdRaw = String(plugin.command[0]);
                const cmdSmall = toSmallCaps(cmdRaw);
                menu += `│ ${cmdSmall}\n`;
              }
            });
            menu += `╰────────────\n`;
          }

          return menu;
        };

        try {
          const plugins = loadMenuPlugins(path.resolve(__dirname, './src/Plugins'));
          const maxs = [max1, max2, max3, max4, max5][Math.floor(Math.random() * 5)];
          const startTime = performance.now();
          try {
            await Frashr.sendMessage(m.chat, { react: { text: '⚡️', key: m.key } });
          } catch (e) {
            console.error('React failed:', e);
          }
          const endTime = performance.now();
          const latensie = endTime - startTime;
          const uptimeSeconds = process.uptime();
          const username = (m.pushName || m.sender || "User");
          const botname = "FLASH_MD";
          const userPlatform = detectUserPlatform(m);

          const menulist = generateMenu(
            plugins,
            ownername,
            prefixz,
            modeStatus,
            versions,
            latensie,
            readmore,
            username,
            uptimeSeconds,
            userPlatform,
            botname
          );

          if (menustyle === '1') {
            Frashr.sendMessage(m.chat, {
              document: {
                url: "https://i.ibb.co/2W0H9Jq/avatar-contact.png",
              },
              caption: menulist,
              mimetype: "application/zip",
              fileName: `${botname}`,
              fileLength: "9999999",
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: '120363400964601488@newsletter',
                  newsletterName: '𝙑𝙀𝙄𝙒 𝘾𝙃𝘼𝙉𝙉𝙀𝙇'
                },
                externalAdReply: {
                  showAdAttribution: true,
                  title: "",
                  body: "",
                  thumbnail: maxs,
                  sourceUrl: plink,
                  mediaType: 1,
                  renderLargerThumbnail: true,
                },
              },
            }, { quoted: fkontak });
          } else if (menustyle === '2') {
            m.reply(menulist);
          } else if (menustyle === '3') {
            Frashr.sendMessage(m.chat, {
              text: menulist,
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: '120363400964601488@newsletter',
                  newsletterName: '𝙑𝙀𝙄𝙒 𝘾𝙃𝘼𝙉𝙉𝙀𝙇'
                },
                externalAdReply: {
                  showAdAttribution: true,
                  title: botname,
                  body: ownername,
                  thumbnail: maxs,
                  sourceUrl: plink,
                  mediaType: 1,
                  renderLargerThumbnail: true,
                },
              },
            }, { quoted: m });
          } else if (menustyle === '4') {
            Frashr.sendMessage(m.chat, {
              image: maxs,
              caption: menulist,
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: '120363400964601488@newsletter',
                  newsletterName: '𝙑𝙀𝙄𝙒 𝘾𝙃𝘼𝙉𝙉𝙀𝙇'
                },
              },
            }, { quoted: m });
          } else if (menustyle === '5') {
            let massage = generateWAMessageFromContent(m.chat, {
              viewOnceMessage: {
                message: {
                  interactiveMessage: {
                    body: { text: null },
                    footer: { text: menulist },
                    nativeFlowMessage: { buttons: [{ text: null }] },
                  },
                },
              },
            }, { quoted: m });
            Frashr.relayMessage(m.chat, massage.message, { messageId: massage.key.id });
          } else if (menustyle === '6') {
            Frashr.relayMessage(m.chat, {
              requestPaymentMessage: {
                currencyCodeIso4217: 'USD',
                requestFrom: '0@s.whatsapp.net',
                amount1000: '1',
                noteMessage: {
                  extendedTextMessage: {
                    text: menulist,
                    contextInfo: {
                      mentionedJid: [m.sender],
                      forwardingScore: 999,
                      isForwarded: true,
                      forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363400964601488@newsletter',
                        newsletterName: '𝙑𝙀𝙄𝙒 𝘾𝙃𝘼𝙉𝙉𝙀𝙇'
                      },
                      externalAdReply: { showAdAttribution: true },
                    },
                  },
                },
              },
            }, {});
          }
        } catch (e) {
          console.error("Error building/sending menu:", e);
          m.reply("An error occurred while building the menu.");
        }

        break;
      }
      
      case "getpp": {
  try {
    let user = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender;
    let ppUrl = await Cypher.profilePictureUrl(user, 'image').catch(_ => 'https://telegra.ph/file/6880771a42bad09dd6087.jpg');
    
    await Cypher.sendMessage(m.chat, {
      image: { url: ppUrl },
      caption: `Profile picture of @${user.split('@')[0]}`,
      mentions: [user]
    }, { quoted: m });
  } catch (error) {
    console.error(error);
    m.reply('Failed to get profile picture');
  }
  break;
}

      case 'fam':
      case 'family':
      case 'friends': {
        try {
          let famText = `
❖ *𝑴𝒀 𝑭𝑨𝑴*❖
╭────────╼
╎◈𝙼𝙰𝚇𝚃𝙴𝙲𝙷=BOT DEV
╎◈ 𝙾𝚁𝙼𝙰𝙽 
╎◈ 𝚃𝙴𝚁𝚁𝙸
╎◈ 𝙺𝙴𝚅𝙸𝙽 𝚃𝙴𝙲𝙷
╎◈ PATRICK=JAYSON
╰────────╼

> ❤️ *Family isn’t always blood — it’s who got your back even online.* 💫
`;

          // Send the text first with an image thumbnail / background
          await Frashr.sendMessage(m.chat, {
            image: { url: 'https://files.catbox.moe/zy5l2q.jpeg' },
            caption: famText,
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 1,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363400964601488@newsletter",
                newsletterName: "𝘾𝙃𝘼𝙉𝙉𝙀𝙇"
              }
            }
          }, { quoted: fkontak });

          // Send short trending Vertigo audio (TikTok version) as voice (ptt)
          await Frashr.sendMessage(m.chat, {
            audio: { url: 'https://files.catbox.moe/4iz6dq.mp3' },
            mimetype: 'audio/mp4',
            ptt: true,
            contextInfo: {
              forwardingScore: 2,
              isForwarded: true
            }
          }, { quoted: m });

        } catch (e) {
          console.error(e);
          reply('.');
        }
        break;
      }

      default: {
        if (budy.startsWith('$')) {
          if (!isCreator) return;
          exec(budy.slice(2), (err, stdout) => {
            if (err) return m.reply(err.toString());
            if (stdout) return m.reply(stdout.toString());
          });
        }

        if (budy.startsWith('>')) {
          if (!isCreator) return;
          try {
            let evaled = await eval(budy.slice(2));
            if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
            await m.reply(evaled);
          } catch (err) {
            console.error(err);
            await m.reply(String(err));
          }
        }

        if (budy.startsWith('=>')) {
          if (!isCreator) return;

          try {
            const result = await eval(`(async () => { return ${budy.slice(3)} })()`);
            m.reply(util.format(result));
          } catch (e) {
            console.error(e);
            m.reply(String(e));
          }
        }
      } // end default
    } // end switch

  } catch (err) {
    let formattedError = util.format(err);
    let errorMessage = String(formattedError);

    if (shouldLogError(errorMessage)) {
      if (typeof err === 'string') {
        m.reply(`An error occurred:\n\nError Description: ${errorMessage}`);
      } else {
        console.log(formattedError);
        Frashr.sendMessage(Frashr.user.id, {
          text: `An error occurred:\n\nError Description: ${errorMessage}`,
          contextInfo: {
            forwardingScore: 9999999,
            isForwarded: true
          }
        }, { ephemeralExpiration: 60 });
      }

      recordError(errorMessage);
    } else {
      console.log(`Repeated error suppressed: ${errorMessage}`);
    }
  }
}

// watch file for changes and reload
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Updated '${__filename}'`)
  delete require.cache[file]
  require(file)
})