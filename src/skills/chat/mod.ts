import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdReport } from "./commands/cmdReport.ts";
import { cmdSetTitle } from "./commands/cmdSetTitle.ts";

export const name: SkillModule["name"] = "chat";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "set_title",
    aliases: ["batiza"],
    description: "Sets the chat title. Only works if the bot is a chat admin.",
    handler: cmdSetTitle,
  },
  {
    command: "report",
    aliases: ["admin"],
    description: "Pings the group admin about the replied message.",
    handler: cmdReport,
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
