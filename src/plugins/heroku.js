const normalizeBoolString = (val) => {
  if (typeof val === "boolean") return val ? "true" : "false";
  if (!val) return "false";
  const v = String(val).trim().toLowerCase();
  if (["1","2","3","4","5","6", "true", "on", "yes"].includes(v)) return "true";
  return "false";
};

module.exports = [
  {
    command: ["anticall"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Specify on/off*\n\nExample: .anticall on\nYou can also use: .anticall decline / .anticall block");
      const value = text.trim().toLowerCase();

      // Support explicit modes
      if (value === "on") {
        // choose default policy when turning on: 'block'
        global.anticall = "block";
        return reply(`✅ *Anticall enabled: ${global.anticall}*\nNo restart required.`);
      }

      if (value === "off") {
        global.anticall = "off";
        return reply(`✅ *Anticall disabled*\nNo restart required.`);
      }

      if (["block", "decline"].includes(value)) {
        global.anticall = value;
        return reply(`✅ *Anticall set to: ${value}*\nNo restart required.`);
      }

      return reply("❌ *Invalid input. Use 'on', 'off', 'block' or 'decline'*");
    }
  },

  {
    command: ["alwaysonline"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Specify on/off*\n\nExample: .alwaysonline on");
      const val = normalizeBoolString(text);
      global.alwaysonline = val; // 'true' or 'false'
      return reply(`✅ *ALWAYS_ONLINE set to ${val.toUpperCase()}*\nApplied immediately (no restart).`);
    }
  },

  {
    command: ['autoread'],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply('*Please specify on/off*\n\nExample: .autoread on');
      const val = normalizeBoolString(text);
      global.autoread = val;
      return reply(`✅ *AUTO_READ set to ${val.toUpperCase()}*\nApplied immediately.`);
    }
  },

  {
    command: ['autostatusreact'],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply('*Please specify on/off*\n\nExample: .autostatusreact on');
      const val = normalizeBoolString(text);
      // keep naming consistent with earlier variable used: global.autoreactstatus or autostatusreact
      global.autoreactstatus = val;
      return reply(`✅ *AUTO_STATUS_REACT set to ${val.toUpperCase()}*\nApplied immediately.`);
    }
  },

  {
    command: ['autostatusview'],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply('*Please specify on/off*\n\nExample: .autostatusview on');
      const val = normalizeBoolString(text);
      global.autoviewstatus = val;
      return reply(`✅ *AUTO_STATUS_VIEW set to ${val.toUpperCase()}*\nApplied immediately.`);
    }
  },

  {
    command: ["chatbot"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Specify on/off*\n\nExample: .chatbot on");
      const val = normalizeBoolString(text);
      global.chatbot = val;
      return reply(`✅ *CHATBOT set to ${val.toUpperCase()}*\nApplied immediately.`);
    }
  },

  {
    command: ["mode"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Specify the mode*\n\nExample: .mode private");
      const mode = text.trim().toLowerCase();
      if (!["private", "public", "group", "pm"].includes(mode)) return reply("❌ *Invalid mode. Use 'private', 'public', 'group', or 'pm'*");
      global.mode = mode;
      return reply(`✅ *Mode set to ${mode.toUpperCase()}*\nApplied immediately.`);
    }
  },

  {
    command: ["setbotname"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Provide a bot name*\n\nExample: .setbotname CypherX");
      global.botname = text.trim();
      return reply(`✅ *Bot name set to:* ${global.botname}\nApplied immediately.`);
    }
  },

  {
    command: ["setmenu"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Provide a menu style*\n\nExample: .setmenu 2");
      global.menustyle = text.trim();
      return reply(`✅ *Menu style set to:* ${global.menustyle}\nApplied immediately.`);
    }
  },

  {
    command: ["setname"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Provide your name*\n\nExample: .setname Tylor");
      global.ownername = text.trim();
      return reply(`✅ *Owner name set to:* ${global.ownername}\nApplied immediately.`);
    }
  },

  {
    command: ["setownernumber"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Provide your number*\n\nExample: .setownernumber 1234567890");
      // keep ownernumber consistent with index/system expectations
      global.ownernumber = text.trim();
      // also set global.ownernumber with domain form if needed elsewhere
      try {
        // ensure ownernumber with JID format used in other checks
        global.ownernumberJid = `${global.ownernumber.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
      } catch (e) {}
      return reply(`✅ *Owner number set to:* ${global.ownernumber}\nApplied immediately.`);
    }
  },

  {
    command: ["setprefix"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Provide a prefix*\n\nExample: .setprefix !");
      global.prefixz = text.trim();
      return reply(`✅ *Prefix set to:* ${global.prefixz}\nApplied immediately.`);
    }
  },

  {
    command: ["setsudo"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Provide one or more sudo numbers*\n\nExample: .setsudo 1234567890, 0987654321");
      // Accept comma/space separated numbers
      const arr = text.trim().split(/[\s,]+/).filter(Boolean);
      global.sudo = arr; // plugin/system expects array of numbers (strings)
      return reply(`✅ *Sudo set to:* ${global.sudo.join(", ")}\nApplied immediately.`);
    }
  },

  // Generic setvar command - updates an in-memory global variable
  {
    command: ['setvar'],
    operate: async (context) => {
      const { m, reply, isCreator } = context;
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      const content = (m.text || "").replace(/^\.?setvar\s*/i, "").trim();
      if (!content) return reply("*Usage:* .setvar VAR_NAME=VALUE\nExample: .setvar AUTO_READ=true");
      // support "VAR=VALUE" or "VAR VALUE"
      let varName, varValue;
      if (content.includes("=")) {
        const idx = content.indexOf("=");
        varName = content.slice(0, idx).trim();
        varValue = content.slice(idx + 1).trim();
      } else {
        const parts = content.split(/\s+/);
        varName = parts.shift();
        varValue = parts.join(" ");
      }
      if (!varName) return reply("*Please provide a variable name.*");
      if (typeof varValue === "undefined" || varValue === "") return reply("*Please provide a value.* Example: .setvar AUTO_READ=true");

      // Apply to global (in-memory)
      try {
        // normalize booleans if the value looks boolean
        const normalized = ["true", "false"].includes(varValue.toLowerCase()) ? varValue.toLowerCase() : varValue;
        global[varName] = normalized;

        // If this is a boolean-like variable commonly used, keep 'true'/'false' strings
        // e.g. if user sets AUTO_READ true -> global.AUTO_READ = 'true'
        // also keep lowercase key variants for compatibility
        global[varName.toLowerCase()] = normalized;

        await reply(`✅ *Environment variable set (in-memory)*\n\`\`\`${varName} = ${normalized}\`\`\`\nApplied immediately (no restart).`);
      } catch (error) {
        console.error("setvar error:", error);
        return reply(`❌ *Failed to set variable:* ${error.message}`);
      }
    }
  },

  {
    command: ["welcome"],
    operate: async ({ Cypher, m, reply, isCreator, text }) => {
      if (!isCreator) return reply("❌ *Only the bot owner can modify this setting.*");
      if (!text) return reply("*Specify on/off*\n\nExample: .welcome on");
      const val = normalizeBoolString(text);
      global.welcome = val;
      return reply(`✅ *WELCOME_MSG set to ${val.toUpperCase()}*\nApplied immediately.`);
    }
  }
];