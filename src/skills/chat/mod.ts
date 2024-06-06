import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdReport } from "./commands/cmdReport.ts";
import { cmdSetTitle } from "./commands/cmdSetTitle.ts";
import { cmdGetChatId } from "./commands/cmdGetChatId.ts";
import { cmdGetFile } from "./commands/cmdGetFile.ts";

const skillModule: SkillModule = {
  name: "chat",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "set_title",
      aliases: ["batiza"],
      description:
        "Sets the chat title. Only works if the bot is a chat admin.",
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
    {
      command: "get_file",
      aliases: ["get_sticker"],
      description: "Gets the file and url from a sticker, video note or gif.",
      handler: cmdGetFile,
      chatType: ["group", "supergroup"],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
