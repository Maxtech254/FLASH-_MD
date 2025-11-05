const os = require('os');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const axios = require('axios');
const moment = require('moment-timezone');
const { formatSize, checkBandwidth, runtime } = require('../../lib/myfunc');
const checkDiskSpace = require('check-disk-space').default;
const performance = require('perf_hooks').performance;
const botImagePath = path.join(process.cwd(), 'Media', 'Images', 'maxtech5.jpg');

let botImage = null;
try {
  if (fs.existsSync(botImagePath)) botImage = fs.readFileSync(botImagePath);
} catch (e) {
  botImage = null;
}

module.exports = [
  {
    command: ['botstatus', 'statusbot'],
    operate: async ({ Cypher, m, reply }) => {
      const used = process.memoryUsage();
      const ramUsage = `${formatSize(used.heapUsed)} / ${formatSize(os.totalmem())}`;
      const freeRam = formatSize(os.freemem());
      const disk = await checkDiskSpace(process.cwd());
      const latencyStart = performance.now();
      
      await reply("⏳ *Calculating ping...*");
      const latencyEnd = performance.now();
      const ping = `${(latencyEnd - latencyStart).toFixed(2)} ms`;

      const { download, upload } = await checkBandwidth();
      const uptime = runtime(process.uptime());

      const response = `
      *🔹 BOT STATUS 🔹*

🔸 *Ping:* ${ping}
🔸 *Uptime:* ${uptime}
🔸 *RAM Usage:* ${ramUsage}
🔸 *Free RAM:* ${freeRam}
🔸 *Disk Usage:* ${formatSize(disk.size - disk.free)} / ${formatSize(disk.size)}
🔸 *Free Disk:* ${formatSize(disk.free)}
🔸 *Platform:* ${os.platform()}
🔸 *NodeJS Version:* ${process.version}
🔸 *CPU Model:* ${os.cpus()[0].model}
🔸 *Downloaded:* ${download}
🔸 *Uploaded:* ${upload}
`;

      Cypher.sendMessage(m.chat, { text: response.trim() }, { quoted: m });
    }
  },
  {
    command: ['pair'],
    operate: async ({ m, text, reply }) => {
      if (!text) return reply('*Provide a phone number*\nExample: .pair 253855856885');
      const number = text.replace(/\+|\s/g, '').trim();
      const apiUrls = [
        `https://xploader-pair.onrender.com/code?number=${encodeURIComponent(number)}`,
        `https://xploaderpair-aa3e628aceb3.herokuapp.com/code?number=${encodeURIComponent(number)}`
      ];

      for (const url of apiUrls) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const data = await response.json();
          const pairCode = data.code || 'No code received';

          return reply(`*⚡️ Pair Code:*\n\`\`\`${pairCode}\`\`\`\n\n⚡️ *How to Link:* 
1. Open WhatsApp on your phone.
2. Go to *Settings > Linked Devices*.
3. Tap *Link a Device* then *Link with Phone*.
4. Enter the pair code above.
5. Alternatively, tap the WhatsApp notification sent to your phone.
\n⏳ *Code expires in 2 minutes!*`);
        } catch (error) {
          continue;
        }
      }

      reply('❌ *Error fetching pair code. Try again later.*');
    }
  },
  {
    command: ['ping', 'p'],
    operate: async ({ m, Cypher }) => {
      const startTime = performance.now();

      try {
        const sentMessage = await Cypher.sendMessage(m.chat, {
          text: "⚡️Pong!",
          contextInfo: { quotedMessage: m.message }
        });
        
        const endTime = performance.now();
        const latency = `${(endTime - startTime).toFixed(2)} ms`;
        
        await Cypher.sendMessage(m.chat, {
          text: `*⚡️FLASH_MD latency speed:* ${latency}`,
          edit: sentMessage.key, 
          contextInfo: { quotedMessage: m.message }
        });

      } catch (error) {
        console.error('Error sending ping message:', error);
        await Cypher.sendMessage(m.chat, {
          text: 'An error occurred while trying to ping.',
          contextInfo: { quotedMessage: m.message }
        });
      }
    }
  },
  {
    command: ['runtime', 'uptime'],
    operate: async ({ Cypher, m, reply }) => {
      const botUptime = runtime(process.uptime());
      reply(`*🔹 ${botUptime}*`);
    }
  },
  {
    command: ['repo', 'sc', 'repository', 'script'],
    operate: async ({ Cypher, m, reply }) => {
      try {
        const apiUrl = 'https://api.github.com/repos/Maxtech254/FLASH-_MD';
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

        const { data } = await axios.get(apiUrl, { headers });

        const repoUrl = data.html_url || 'https://github.com/Maxtech254/FLASH-_MD';
        const description = data.description || 'No description available';

        // Build caption using the design you provided
        let caption = `*乂  FLASH - MD  乂*\n\n`;
        caption += `✩  *Name* : ${data.name || 'FLASH-_MD'}\n`;
        caption += `✩  *Description* : ${description}\n`;
        caption += `✩  *Watchers* : ${data.watchers_count}\n`;
        caption += `✩  *Size* : ${((data.size || 0) / 1024).toFixed(2)} MB\n`;
        caption += `✩  *Last Updated* : ${moment(data.updated_at).format('DD/MM/YY - HH:mm:ss')}\n`;
        caption += `✩  *URL* : ${repoUrl}\n`;
        caption += `✩  *Forks* : ${data.forks_count}\n`;
        caption += `✩  *Stars* : ${data.stargazers_count}\n\n`;
        caption += `💥 *FLASH - MD*`;

        // Determine image to use: prefer botImage, otherwise try common fallbacks
        let imageBuffer = botImage;
        if (!imageBuffer) {
          const candidatePaths = [
            path.join(process.cwd(), 'Media', 'Images', 'maxtech5.jpg'),
            path.join(__dirname, '..', 'Media', 'Images', 'maxtech5.jpg'),
            path.join(__dirname, '..', 'assets', 'bot_image.jpg'),
            path.join(__dirname, '..', 'assets', 'bot_image.png')
          ];
          for (const p of candidatePaths) {
            try {
              if (fs.existsSync(p)) {
                imageBuffer = fs.readFileSync(p);
                break;
              }
            } catch (e) {
              // ignore and try next
            }
          }
        }

        if (imageBuffer) {
          await Cypher.sendMessage(m.chat, {
            image: imageBuffer,
            caption,
            contextInfo: {
              mentionedJid: [m.sender],
              externalAdReply: {
                showAdAttribution: true,
                title: data.full_name || 'FLASH - MD Repository',
                body: description,
                mediaType: 1,
                thumbnail: imageBuffer,
                sourceUrl: repoUrl
              }
            }
          }, { quoted: m });
        } else {
          // Fallback: text-only reply with repo link
          await Cypher.sendMessage(m.chat, { text: `${caption}\n\n${repoUrl}` }, { quoted: m });
        }
      } catch (error) {
        console.error('Error fetching repository details:', error);
        reply('❌ *Error fetching repository details. Try again later.*');
      }
    }
  },
  {
    command: ['time', 'date'],
    operate: async ({ m, reply }) => {
      const now = moment().tz(global.timezones);
      const timeInfo = `
      *🔹 CURRENT TIME 🔹*

🔸 *Day:* ${now.format('dddd')}
🔸 *Time:* ${now.format('HH:mm:ss')}
🔸 *Date:* ${now.format('LL')}
🔸 *Timezone:* ${global.timezones}
`;

      reply(timeInfo.trim());
    }
  }
];