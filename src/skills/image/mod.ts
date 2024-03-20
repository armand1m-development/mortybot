import { SessionData } from "/src/context/mod.ts";
import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdCreateMeme } from "./commands/cmdCreateMeme.ts";
import { cmdCreateMemeTemplate } from "./commands/cmdCreateMemeTemplate.ts";
import { getInitialMemeTemplateSessionData } from "./sessionData/getInitialMemeTemplateSessionData.ts";
import { cmdGetMemeTemplate } from "./commands/cmdGetMemeTemplate.ts";
import { cmdToggleMemeTemplateDebug } from "./commands/cmdToggleMemeTemplateDebug.ts";

export const name: SkillModule["name"] = "image";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "create_meme_template",
    aliases: ["memetemplate"],
    description:
      "Creates a meme template based on a given image and text parameters.",
    handler: cmdCreateMemeTemplate,
  },
  {
    command: "create_meme",
    aliases: ["meme"],
    description:
      "Creates a meme based on a template. The number of arguments depends on the template itself.",
    handler: cmdCreateMeme,
  },
  {
    command: "get_meme_template",
    aliases: [],
    description: "Get meme template by name. Useful for debugging purposes.",
    handler: cmdGetMemeTemplate,
  },
  {
    command: "toggle_meme_template_debug",
    aliases: ["debugtemplate"],
    description:
      "Toggle meme template debug mode (adds a red border to the slots).",
    handler: cmdToggleMemeTemplateDebug,
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] = [
  getInitialMemeTemplateSessionData,
];

export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];

export const migrations: SkillModule["migrations"] = {
  2: function addMemeTemplatesToSessionData(old: SessionData): SessionData {
    return {
      ...old,
      memeTemplates: old.memeTemplates ?? new Map(),
    };
  },
};
