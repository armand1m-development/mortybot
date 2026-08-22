import type { SessionData } from "/src/context/mod.ts";
import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdCreateMeme } from "./commands/cmdCreateMeme.ts";
import { cmdCreateMemeTemplate } from "./commands/cmdCreateMemeTemplate.ts";
import { getInitialMemeTemplateSessionData } from "./sessionData/getInitialMemeTemplateSessionData.ts";
import { cmdGetMemeTemplate } from "./commands/cmdGetMemeTemplate.ts";
import { cmdToggleMemeTemplateDebug } from "./commands/cmdToggleMemeTemplateDebug.ts";
import { createRouter } from "./router/mod.ts";
import * as queryString from "querystring";
import {
  assistantToolObjectSchema,
  createAssistantTool,
  noArgumentAssistantTool,
  requireStringArgument,
  textAssistantTool,
} from "/src/platform/skillModules/assistantTool.ts";

const skillModule: SkillModule = {
  name: "image",
  description:
    "Commands to create meme templates, memes and other image-related tasks. See https://mortybotui.fly.dev to see the available meme templates and how to create more. Meme templates are defined per user or group.",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "create_meme_template",
      aliases: ["memetemplate"],
      description:
        "Creates a meme template based on a given image and text parameters.",
      handler: cmdCreateMemeTemplate,
      assistantTool: createAssistantTool(
        assistantToolObjectSchema({
          template: {
            type: "object",
            description:
              "A MemeTemplateEntry with name, image URL, and positioned text parameters.",
            required: ["name", "url", "params"],
            properties: {
              name: { type: "string" },
              url: { type: "string", format: "uri" },
              params: { type: "array", items: { type: "object" } },
            },
          },
        }, ["template"]),
        (args) => {
          const template = args.template;
          if (typeof template !== "object" || template === null) {
            throw new TypeError('Tool argument "template" must be an object.');
          }
          return JSON.stringify(template);
        },
        { effect: "write" },
      ),
    },
    {
      command: "create_meme",
      aliases: ["meme"],
      description:
        "Creates a meme based on a template. The number of arguments depends on the template itself.",
      handler: cmdCreateMeme,
      assistantTool: createAssistantTool(
        assistantToolObjectSchema({
          template: {
            type: "string",
            description: "The meme template name.",
          },
          texts: {
            type: "object",
            description:
              "Text values keyed by the template's slot names, such as top and bottom.",
            additionalProperties: { type: "string" },
          },
        }, ["template", "texts"]),
        (args) => {
          const template = requireStringArgument(args, "template");
          const texts = args.texts;
          if (typeof texts !== "object" || texts === null) {
            throw new TypeError('Tool argument "texts" must be an object.');
          }
          const entries = Object.entries(texts);
          if (!entries.every(([, value]) => typeof value === "string")) {
            throw new TypeError("Every meme text value must be a string.");
          }
          return `${template} ${
            queryString.stringify(texts as Record<string, string>)
          }`;
        },
      ),
    },
    {
      command: "get_meme_template",
      aliases: [],
      description: "Get meme template by name. Useful for debugging purposes.",
      handler: cmdGetMemeTemplate,
      assistantTool: textAssistantTool("template", {
        argumentDescription: "The meme template name.",
      }),
    },
    {
      command: "toggle_meme_template_debug",
      aliases: ["debugtemplate"],
      description:
        "Toggle meme template debug mode (adds a red border to the slots).",
      handler: cmdToggleMemeTemplateDebug,
      assistantTool: noArgumentAssistantTool("write"),
    },
  ],
  sessionDataInitializers: [getInitialMemeTemplateSessionData],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {
    1717523737806: function addMemeTemplatesToSessionData(
      old: SessionData,
    ): SessionData {
      return {
        ...old,
        memeTemplates: old.memeTemplates ?? new Map(),
      };
    },
  },
  router: createRouter(),
};

export default skillModule;
