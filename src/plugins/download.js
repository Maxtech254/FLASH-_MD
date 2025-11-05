const { fetchJson } = require('../../lib/myfunc');
const { ringtone } = require('../../lib/scraper');
const fetch = require('node-fetch'); 
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');

module.exports = [
 {
  command: ['apk', 'apkdl'],
  operate: async ({ m, text, Cypher, botname, reply }) => {
    if (!text) return reply("*Which apk do you want to download?*");
    
    try {
      let kyuu = await fetchJson(`https://bk9.fun/search/apk?q=${text}`);
      let tylor = await fetchJson(`https://bk9.fun/download/apk?id=${kyuu.BK9[0].id}`);

      await Cypher.sendMessage(
        m.chat,
        {
          document: { url: tylor.BK9.dllink },
          fileName: tylor.BK9.name,
          mimetype: "application/vnd.android.package-archive",
          contextInfo: {
            externalAdReply: {
              title: botname,
              body: `${tylor.BK9.name}`,
              thumbnailUrl: `${tylor.BK9.icon}`,
              sourceUrl: `${tylor.BK9.dllink}`,
              mediaType: 2,
              showAdAttribution: true,
              renderLargerThumbnail: false
            }
          }
        },
        { quoted: m }
      );
    } catch (error) {
      reply(`*Error fetching APK details*\n${error.message}`);
    }
  }
 },
  {
  command: ['download'],
  operate: async ({ m, text, Cypher, reply }) => {
    if (!text) return reply('Enter download URL');
    
    try {
      let res = await fetch(text, { method: 'GET', redirect: 'follow' });
      let contentType = res.headers.get('content-type');
      let buffer = await res.buffer();
      let extension = contentType ? contentType.split('/')[1] : 'bin';
      let filename = res.headers.get('content-disposition')?.match(/filename="(.*)"/)?.[1] || `download-${Math.random().toString(36).slice(2, 10)}.${extension}`;

      let mimeType;
      switch (contentType) {
        case 'audio/mpeg':
          mimeType = 'audio/mpeg';
          break;
        case 'image/png':
          mimeType = 'image/png';
          break;
        case 'image/jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'application/pdf':
          mimeType = 'application/pdf';
          break;
        case 'application/zip':
          mimeType = 'application/zip';
          break;
        case 'video/mp4':
          mimeType = 'video/mp4';
          break;
        case 'video/webm':
          mimeType = 'video/webm';
          break;
        case 'application/vnd.android.package-archive':
          mimeType = 'application/vnd.android.package-archive';
          break;
        default:
          mimeType = contentType || 'application/octet-stream';
      }

      Cypher.sendMessage(m.chat, { document: buffer, mimetype: mimeType, fileName: filename }, { quoted: m });
    } catch (error) {
      reply(`Error downloading file: ${error.message}`);
    }
  }
},
  {
  command: ['facebook', 'fbdl'],
  operate: async ({ m, text, Cypher, reply }) => {
    if (!text) return reply(`*Please provide a Facebook video url!*`);
    
    try {
      var anut = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${text}`);
      var hasdl = anut.data[0].url;
      
      await Cypher.sendMessage(m.chat, {
        video: {
          url: hasdl,
          caption: global.botname
        }
      }, {
        quoted: m
      });
    } catch (error) {
      reply(`Error fetching video: ${error.message}`);
    }
  }
},
  {
  command: ['gdrive'],
  operate: async ({ Cypher, m, reply, text }) => {
    if (!text) return reply("*Please provide a Google Drive file URL*");

    try {
      let response = await fetch(`https://api.siputzx.my.id/api/d/gdrive?url=${encodeURIComponent(text)}`);
      let data = await response.json();

      if (response.status !== 200 || !data.status || !data.data) {
        return reply("*Please try again later or try another command!*");
      } else {
        const downloadUrl = data.data.download;
        const filePath = path.join(__dirname, `${data.data.name}`);

        const writer = fs.createWriteStream(filePath);
        const fileResponse = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream'
        });

        fileResponse.data.pipe(writer);

        writer.on('finish', async () => {
          await Cypher.sendMessage(m.chat, {
            document: { url: filePath },
            fileName: data.data.name,
            mimetype: fileResponse.headers['content-type']
          });

          fs.unlinkSync(filePath);
        });

        writer.on('error', (err) => {
          console.error('Error downloading the file:', err);
          reply("An error occurred while downloading the file.");
        });
      }
    } catch (error) {
      console.error('Error fetching Google Drive file details:', error);
      reply("An error occurred while fetching the Google Drive file details.");
    }
  }
},
  {
  command: ['gitclone'],
  operate: async ({ m, args, prefix, command, Cypher, reply, mess, isUrl }) => {
    if (!args[0])
      return reply(`*GitHub link to clone?*\nExample :\n${prefix}${command} https://github.com/Dark-Xploit/CypherX`);
    
    if (!isUrl(args[0]))
      return reply("*Link invalid! Please provide a valid URL.*");

    const regex1 = /(?:https|git)(?::\/\/|@)(www\.)?github\.com[\/:]([^\/:]+)\/(.+)/i;
    const [, , user, repo] = args[0].match(regex1) || [];
    
    if (!repo) {
      return reply("*Invalid GitHub link format. Please double-check the provided link.*");
    }
    
    const repoName = repo.replace(/.git$/, "");
    const url = `https://api.github.com/repos/${user}/${repoName}/zipball`;
    
    try {
      const response = await fetch(url, { method: "HEAD" });
      const filename = response.headers
        .get("content-disposition")
        .match(/attachment; filename=(.*)/)[1];
      
      await Cypher.sendMessage(
        m.chat,
        {
          document: { url: url },
          fileName: filename + ".zip",
          mimetype: "application/zip",
        },
        { quoted: m }
      );
    } catch (err) {
      console.error(err);
      reply(mess.error);
    }
  }
},
 {
  command: ['image', 'img'],
  operate: async ({ Cypher, m, reply, text }) => {
    if (!text) return reply("*Please provide a search query*");

    try {
      let response = await fetch(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(text)}`);
      let data = await response.json();

      if (response.status !== 200 || !data.status || !data.data || data.data.length === 0) {
        return reply("*Please try again later or try another command!*");
      } else {
        // Send the first 5 images
        const images = data.data.slice(0, 5);

        for (const image of images) {
          await Cypher.sendMessage(m.chat, {
            image: { url: image.images_url },
          });
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      reply("An error occurred while fetching images.");
    }
  }
},
 {
  command: ['instagram', 'igdl'],
  operate: async ({ Cypher, m, reply, text }) => {
    if (!text) return reply('*Please provide an Instagram URL!*');

    const apiUrl = `https://xploader-api.vercel.app/igdl?url=${encodeURIComponent(text)}`;
    
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (!data || data.url.length === 0) return reply('*Failed to retrieve the video!*');

      const videoUrl = data.url;
      const title = `Instagram Video`;

      await Cypher.sendMessage(m.chat, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`
      }, { quoted: m });
    } catch (error) {
      console.error('Download command failed:', error);
      m.reply(`Error: ${error.message}`);
    }
  }
},
  {
  command: ['itunes'],
  operate: async ({ m, text, Cypher, reply }) => {
    if (!text) return reply("*Please provide a song name*");
    
    try {
      let res = await fetch(`https://api.popcat.xyz/itunes?q=${encodeURIComponent(text)}`);
      if (!res.ok) {
        throw new Error(`*API request failed with status ${res.status}*`);
      }
      let json = await res.json();
      let songInfo = `*Song Information:*\n
 • *Name:* ${json.name}\n
 • *Artist:* ${json.artist}\n
 • *Album:* ${json.album}\n
 • *Release Date:* ${json.release_date}\n
 • *Price:* ${json.price}\n
 • *Length:* ${json.length}\n
 • *Genre:* ${json.genre}\n
 • *URL:* ${json.url}`;
     
      if (json.thumbnail) {
        await Cypher.sendMessage(
          m.chat,
          { image: { url: json.thumbnail }, caption: songInfo },
          { quoted: m }
        );
      } else {
        reply(songInfo);
      }
    } catch (error) {
      console.error(error);
      reply(`Error fetching song information: ${error.message}`);
    }
  }
},
  {
  command: ['mediafire'],
  operate: async ({ Cypher, m, reply, text }) => {
    if (!text) return reply("*Please provide a MediaFire file URL*");

    try {
      let response = await fetch(`https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(text)}`);
      let data = await response.json();

      if (response.status !== 200 || !data.status || !data.data) {
        return reply("*Please try again later or try another command!*");
      } else {
        const downloadUrl = data.data.downloadLink;
        const filePath = path.join(__dirname, `${data.data.fileName}.zip`);

        const writer = fs.createWriteStream(filePath);
        const fileResponse = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream'
        });

        fileResponse.data.pipe(writer);

        writer.on('finish', async () => {
          
          await Cypher.sendMessage(m.chat, {
            document: { url: filePath },
            fileName: data.data.fileName,
            mimetype: 'application/zip'
          });

          fs.unlinkSync(filePath);
        });

        writer.on('error', (err) => {
          console.error('Error downloading the file:', err);
          reply("An error occurred while downloading the file.");
        });
      }
    } catch (error) {
      console.error('Error fetching MediaFire file details:', error);
      reply("An error occurred while fetching the MediaFire file details.");
    }
  }
},
  {
  command: ['pinterest'],
  operate: async ({ Cypher, m, reply, text }) => {
    if (!text) return reply("*Please provide a search query*");

    try {
      let response = await fetch(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(text)}`);
      let data = await response.json();

      if (response.status !== 200 || !data.status || !data.data || data.data.length === 0) {
        return reply("*Please try again later or try another command!*");
      } else {
        // Send only the first image
        const image = data.data[0];

        await Cypher.sendMessage(m.chat, {
          image: { url: image.images_url },
          caption: `Title: ${image.grid_title}\nLink: ${image.link}`
        });
      }
    } catch (error) {
      console.error('Error fetching Pinterest images:', error);
      reply("An error occurred while fetching Pinterest images.");
    }
  }
},
 {
  command: ['play', 'song'],
  operate: async ({ Cypher, m, reply, text }) => {
    if (!text) return reply('*Please provide a song name!*');

    // Helper: sanitize filename
    const sanitize = (s) => (s || 'unknown').toString().replace(/[\\/:"*?<>|]+/g, '').trim();

    // Helper: recursively find first URL in object (prefer mp3)
    const findUrl = (obj) => {
      if (!obj) return null;
      if (typeof obj === 'string') {
        if (/^https?:\/\/.+/i.test(obj)) return obj;
        return null;
      }
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const res = findUrl(item);
          if (res) return res;
        }
      } else if (typeof obj === 'object') {
        // prefer keys containing download/audio/mp3/link/url
        const keysPriority = Object.keys(obj || {}).sort((a, b) => {
          const pa = /(audio|download|mp3|link|url)/i.test(a) ? -1 : 0;
          const pb = /(audio|download|mp3|link|url)/i.test(b) ? -1 : 0;
          return pa - pb;
        });
        for (const k of keysPriority) {
          const val = obj[k];
          if (typeof val === 'string' && /^https?:\/\/.+/i.test(val)) {
            if (/\.mp3($|\?)/i.test(val) || /(download|audio|mp3)/i.test(k)) return val;
            return val;
          }
          const nested = findUrl(val);
          if (nested) return nested;
        }
      }
      return null;
    };

    // Helper: get thumbnail candidate from response
    const findThumbnail = (obj) => {
      if (!obj) return null;
      if (typeof obj === 'string') return null;
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const t = findThumbnail(item);
          if (t) return t;
        }
      } else if (typeof obj === 'object') {
        for (const k of Object.keys(obj)) {
          if (/(thumb|thumbnail|thumbnailUrl|image|poster|thumbUrl)/i.test(k) && typeof obj[k] === 'string' && /^https?:\/\//i.test(obj[k])) {
            return obj[k];
          }
        }
        for (const k of Object.keys(obj)) {
          const t = findThumbnail(obj[k]);
          if (t) return t;
        }
      }
      return null;
    };

    // Helper: resolve final URL and content-type by HEAD then GET fallback
    const resolveFinalUrl = async (url) => {
      try {
        // Try HEAD first
        const headRes = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        if (headRes && headRes.ok) {
          return {
            finalUrl: headRes.url || url,
            contentType: (headRes.headers.get('content-type') || '').toLowerCase()
          };
        }
      } catch (err) {
        // ignore head errors and fallback to GET
      }
      // Fallback to GET
      try {
        const getRes = await fetch(url, { method: 'GET', redirect: 'follow' });
        // Do not consume body to avoid memory usage; just inspect headers/url
        return {
          finalUrl: getRes.url || url,
          contentType: (getRes.headers.get('content-type') || '').toLowerCase()
        };
      } catch (err) {
        throw new Error('Failed to fetch file URL: ' + err.message);
      }
    };

    try {
      // React immediately to the user's message to show quick acknowledgment (fast reaction)
      try {
        if (m && m.key) {
          await Cypher.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        }
      } catch (reactErr) {
        // ignore reaction errors but log
        console.warn('Initial fast reaction failed:', reactErr && (reactErr.message || reactErr));
      }

      // Query Terris API
      const apiUrl = `https://terrisapi.zone.id/dl/yt/play?query=${encodeURIComponent(text)}&apikey=terri`;
      const apiRes = await fetch(apiUrl, { method: 'GET', redirect: 'follow' });
      if (!apiRes.ok) throw new Error(`API request failed with status ${apiRes.status}`);

      const json = await apiRes.json();

      // Try to extract title and duration from response
      const getField = (obj, keys) => {
        if (!obj) return undefined;
        for (const k of keys) {
          if (obj[k]) return obj[k];
        }
        return undefined;
      };

      const titleRaw = getField(json, ['title', 'name', 'resultTitle', 'videoTitle']) || (json.result && getField(json.result, ['title', 'name'])) || text;
      const title = sanitize(titleRaw);

      const duration = getField(json, ['duration', 'time', 'length', 'formattedDuration']) || (json.result && getField(json.result, ['duration', 'time']));

      // Find thumbnail if available
      const thumbnail = findThumbnail(json) || (json.result && findThumbnail(json.result)) || null;

      // Prepare the exact message the user asked for
      const metaText = `🎵 Downloading: *${title}*\n⏱ Duration: ${duration || 'Unknown'}\n${thumbnail ? `\nThumbnail: ${thumbnail}` : ''}\n\nPlease wait...`;

      // Send metadata quickly (thumbnail as image+caption when available for better preview)
      let sentMeta;
      try {
        if (thumbnail) {
          sentMeta = await Cypher.sendMessage(m.chat, {
            image: { url: thumbnail },
            caption: metaText
          }, { quoted: m });
        } else {
          sentMeta = await Cypher.sendMessage(m.chat, { text: metaText }, { quoted: m });
        }
      } catch (metaErr) {
        // fallback without quoted
        try {
          if (thumbnail) {
            sentMeta = await Cypher.sendMessage(m.chat, {
              image: { url: thumbnail },
              caption: metaText
            });
          } else {
            sentMeta = await Cypher.sendMessage(m.chat, { text: metaText });
          }
        } catch (e) {
          console.warn('Failed to send metadata message:', e);
        }
      }

      // Find a candidate URL in API response
      let candidate = findUrl(json) || (json.result && findUrl(json.result)) || null;
      if (!candidate) throw new Error('Download URL not found in API response');

      // Resolve final URL and content-type
      const { finalUrl, contentType } = await resolveFinalUrl(candidate);

      // Always send the file as a document (mp3) per user preference.
      // Ensure filename ends with .mp3 and sanitize it.
      const filename = `${title || 'track'}.mp3`.replace(/\s+/g, ' ').trim();

      // Prepare contextInfo.externalAdReply for preview (if thumbnail exists)
      const contextInfo = thumbnail ? {
        externalAdReply: {
          title: title,
          body: `Duration: ${duration || 'Unknown'}`,
          thumbnailUrl: thumbnail,
          sourceUrl: finalUrl,
          mediaType: 2,
          showAdAttribution: true
        }
      } : {};

      // Send the MP3 as a document (remote URL). Use mimetype audio/mpeg to hint client.
      await Cypher.sendMessage(m.chat, {
        document: { url: finalUrl },
        mimetype: 'audio/mpeg',
        fileName: sanitize(filename),
        contextInfo: contextInfo
      }, { quoted: m });

      // Final reaction on the user's message to indicate completion (✅)
      try {
        if (m && m.key) {
          await Cypher.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        }
      } catch (reactDoneErr) {
        console.warn('Final reaction failed:', reactDoneErr && (reactDoneErr.message || reactDoneErr));
      }

    } catch (error) {
      console.error('play command failed:', error);
      reply(`Error: ${error.message}`);
    }
  }
},
  {
  command: ['playdoc', 'songdoc'],
  operate: async ({ Cypher, m, reply, text, fetchMp3DownloadUrl }) => {
    if (!text) return reply('*Please provide a song name!*');

    try {
      const search = await yts(text);
      if (!search || search.all.length === 0) return reply('*The song you are looking for was not found.*');

      const video = search.all[0];
      const downloadUrl = await fetchMp3DownloadUrl(video.url);

      await Cypher.sendMessage(m.chat, {
        document: { url: downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${video.title}.mp3`
      }, { quoted: m });

    } catch (error) {
      console.error('playdoc command failed:', error);
      reply(`Error: ${error.message}`);
    }
  }
},
 {
  command: ['ringtone'],
  operate: async ({ m, text, prefix, command, Cypher, reply }) => {
    if (!text) return reply(`*Example: ${prefix + command} black rover*`);
    
    try {
      let anutone2 = await ringtone.ringtone(text);
      let result = anutone2[Math.floor(Math.random() * anutone2.length)];
      
      await Cypher.sendMessage(
        m.chat,
        {
          audio: { url: result.audio },
          fileName: result.title + ".mp3",
          mimetype: "audio/mpeg",
        },
        { quoted: m }
      );
    } catch (error) {
      reply(`Error fetching ringtone: ${error.message}`);
    }
  }
},
  {
  command: ['savestatus', 'save'],
  operate: async ({ m, saveStatusMessage }) => {
    await saveStatusMessage(m);
  }
},
 {
  command: ['tiktok', 'tikdl', 'tiktokvideo'],
  operate: async ({ m, args, fetchJson, Cypher, reply }) => {
    if (!args[0]) return reply('*Please provide a TikTok video url!*');
    
    try {
      let kyuu = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/tiktok?url=${args[0]}`);
      
      await Cypher.sendMessage(
        m.chat,
        {
          caption: global.wm,
          video: { url: kyuu.data.video },
          fileName: "video.mp4",
          mimetype: "video/mp4",
        },
        { quoted: m }
      );
    } catch (error) {
      reply(`Error fetching video: ${error.message}`);
    }
  }
},
 {
  command: ['tiktokaudio'],
  operate: async ({ m, args, fetchJson, Cypher, reply }) => {
    if (!args[0]) return reply('*Please provide a TikTok audio url!*');
    
    try {
      let kyuu = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/tiktok?url=${args[0]}`);
      
      await Cypher.sendMessage(
        m.chat,
        {
          audio: { url: kyuu.data.audio },
          fileName: "tiktok.mp3",
          mimetype: "audio/mpeg",
        },
        { quoted: m }
      );
    } catch (error) {
      reply(`Error fetching audio: ${error.message}`);
    }
  }
},
  {
  command: ['video'],
  operate: async ({ Cypher, m, reply, text, fetchVideoDownloadUrl }) => {
    if (!text) return reply('*Please provide a song name!*');

    try {
      const search = await yts(text);
      if (!search || search.all.length === 0) return reply('*The song you are looking for was not found.*');

      const video = search.all[0]; 
      const videoData = await fetchVideoDownloadUrl(video.url);

      await Cypher.sendMessage(m.chat, {
        video: { url: videoData.download_url },
        mimetype: 'video/mp4',
        fileName: `${videoData.title}.mp4`,
        caption: videoData.title
      }, { quoted: m });

    } catch (error) {
      console.error('video command failed:', error);
      reply(`Error: ${error.message}`);
    }
  }
},
  {
  command: ['videodoc'],
  operate: async ({ Cypher, m, reply, text, fetchVideoDownloadUrl }) => {
    if (!text) return reply('*Please provide a song name!*');

    try {
      const search = await yts(text);
      if (!search || search.all.length === 0) return reply('*The song you are looking for was not found.*');

      const video = search.all[0]; 
      const videoData = await fetchVideoDownloadUrl(video.url);

      await Cypher.sendMessage(m.chat, {
        document: { url: videoData.download_url },
        mimetype: 'video/mp4',
        fileName: `${videoData.title}.mp4`,
        caption: videoData.title
      }, { quoted: m });

    } catch (error) {
      console.error('videodoc command failed:', error);
      reply(`Error: ${error.message}`);
    }
  }
},
 {
  command: ['xvideos', 'porn', 'xdl'],
  operate: async ({ m, text, isCreator, reply, mess, Cypher, fetchJson, quoted }) => {
  if (!isCreator) return reply(mess.owner);
	if (!text) return reply('*Please provide a porn video search query!*');
    let kutu = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/search/xnxx?search=${text}`)
	let kyuu = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/xnxx?url=${kutu.result.result[0].link}`)
await Cypher.sendMessage(m.chat, {
 video: {url: kyuu.data.files.high}, 
 caption: global.wm,
 contextInfo: {
        externalAdReply: {
          title: global.botname,
          body: `${kutu.result.result[0].title}`,
          sourceUrl: `${kutu.result.result[0].link}`,
          mediaType: 2,
          mediaUrl: `${kutu.result.result[0].link}`,
        }
      }
    }, { quoted: m });
    
	let kyut = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/xnxx?url=${kutu.result.result[1].link}`)
await Cypher.sendMessage(m.chat, {
 video: {url: kyut.data.files.high}, 
 caption: global.wm,
 contextInfo: {
        externalAdReply: {
          title: global.botname,
          body: `${kutu.result.result[1].title}`,
          sourceUrl: `${kutu.result.result[1].link}`,
          mediaType: 2,
          mediaUrl: `${kutu.result.result[1].link}`,
        }
      }
    }, { quoted: m });
  }
},
  {
  command: ['ytmp3'],
  operate: async ({ Cypher, m, reply, text, fetchMp3DownloadUrl }) => {
    if (!text) return reply('*Please provide a valid YouTube link!*');

    try {
      const urlMatch = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
      if (!urlMatch) return reply('*Seems like your message does not contain a valid YouTube link*');

      const link = urlMatch[0];
      const downloadUrl = await fetchMp3DownloadUrl(link);

      await Cypher.sendMessage(m.chat, {
        audio: { url: downloadUrl },
        mimetype: 'audio/mpeg'
      }, { quoted: m });

    } catch (error) {
      console.error('ytmp3 command failed:', error);
      reply(`Error: ${error.message}`);
    }
  }
},
 {
  command: ['ytmp3doc'],
  operate: async ({ Cypher, m, reply, text, fetchMp3DownloadUrl }) => {
    if (!text) return reply('*Please provide a valid YouTube link!*');

    try {
      const urlMatch = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
      if (!urlMatch) return reply('*Seems like your message does not contain a valid YouTube link*');

      const link = urlMatch[0];
      const downloadUrl = await fetchMp3DownloadUrl(link);

      await Cypher.sendMessage(m.chat, {
        document: { url: downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${link}.mp3`
      }, { quoted: m });

    } catch (error) {
      console.error('ytmp3doc command failed:', error);
      reply(`Error: ${error.message}`);
    }
  }
},
  {
  command: ['ytmp4'],
  operate: async ({ Cypher, m, reply, text, fetchVideoDownloadUrl }) => {
    if (!text) return reply('*Please provide a valid YouTube link!*');

    try {
      const urlMatch = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
      if (!urlMatch) return reply('*Seems like your message does not contain a valid YouTube link*');

      const link = urlMatch[0];
      const videoData = await fetchVideoDownloadUrl(link);

      await Cypher.sendMessage(m.chat, {
        video: { url: videoData.download_url },
        mimetype: 'video/mp4',
        fileName: `${videoData.title}.mp4`,
        caption: videoData.title
      }, { quoted: m });

    } catch (error) {
      console.error('ytmp4 command failed:', error);
      reply(`Error: ${error.message}`);
    }
  }
},
{
  command: ['ytmp4doc'],
  operate: async ({ Cypher, m, reply, text, fetchVideoDownloadUrl }) => {
    if (!text) return reply('*Please provide a valid YouTube link!*');

    try {
      const urlMatch = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
      if (!urlMatch) return reply('*Seems like your message does not contain a valid YouTube link*');

      const link = urlMatch[0];
      const videoData = await fetchVideoDownloadUrl(link);

      await Cypher.sendMessage(m.chat, {
        document: { url: videoData.download_url },
        mimetype: 'video/mp4',
        fileName: `${videoData.title}.mp4`,
        caption: videoData.title
      }, { quoted: m });

    } catch (error) {
      console.error('ytmp4doc command failed:', error);
      reply(`Error: ${error.message}`);
    }
  }
},
];