import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdReport } from "./commands/cmdReport.ts";
import { cmdSetTitle } from "./commands/cmdSetTitle.ts";
import { cmdGetChatId } from "./commands/cmdGetChatId.ts";
import { cmdGetFile } from "./commands/cmdGetFile.ts";
import { mustHaveReplyMiddleware } from "/src/utilities/middlewares/mustHaveReplyMiddleware.ts";
import { cmdCreateCommandAlias } from "./commands/cmdCreateCommandAlias.ts";

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
      middlewares: [mustHaveReplyMiddleware],
    },
    {
      command: "chat_id",
      aliases: ["id"],
      description: "Gets the chat id.",
      handler: cmdGetChatId,
    },
    {
      command: "get_file",
      aliases: ["get_sticker"],
      description: "Gets the file and url from a sticker, video note or gif.",
      handler: cmdGetFile,
      middlewares: [mustHaveReplyMiddleware],
    },
    {
      command: "create_command_alias",
      aliases: ["cmd", "alias"],
      description: "Gets the file and url from a sticker, video note or gif.",
      handler: cmdCreateCommandAlias,
      middlewares: [mustHaveReplyMiddleware],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
