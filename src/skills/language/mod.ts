import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import type { SessionData } from "/src/context/mod.ts";
import { defaultLanguage } from "/src/i18n/mod.ts";
import { cmdLanguage } from "./commands/cmdLanguage.ts";
import { getInitialLanguageSessionData } from "./sessionData/getInitialLanguageSessionData.ts";

const skillModule: SkillModule = {
  name: "language",
  description: "Controls the language used by the bot in each chat.",
  commands: [{
    command: "language",
    aliases: ["idioma"],
    description: "Changes the bot language between PT and EN",
    handler: cmdLanguage,
  }],
  sessionDataInitializers: [getInitialLanguageSessionData],
  migrations: {
    1786356000000: function addLanguage(old: SessionData): SessionData {
      return {
        ...old,
        language: old.language ?? defaultLanguage,
      };
    },
  },
  initializers: [],
  middlewares: [],
  listeners: [],
  inlineQueryListeners: [],
  router: null,
};

export default skillModule;
