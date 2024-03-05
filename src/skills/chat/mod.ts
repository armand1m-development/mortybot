import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdReport } from "./commands/cmdReport.ts";
import { cmdSetTitle } from "./commands/cmdSetTitle.ts";
import { cmdGetChatId } from "./commands/cmdGetChatId.ts";

export const name: SkillModule["name"] = "chat";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "set_title",
    aliases: ["batiza"],
    description: "Sets the chat title. Only works if the bot is a chat admin.",
    handler: cmdSetTitle,
    chatType: ["group", "supergroup"],
  },
  {
    command: "report",
    aliases: ["admin"],
    description: "Pings the group admin about the replied message.",
    handler: cmdReport,
    chatType: ["group", "supergroup"],
  },
  {
    command: "chat_id",
    aliases: ["id"],
    description: "Gets the chat id.",
    handler: cmdGetChatId,
    chatType: ["group", "supergroup"],
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
