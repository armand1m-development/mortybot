import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdReport } from "./commands/cmdReport.ts";
import { cmdSetTitle } from "./commands/cmdSetTitle.ts";
import { cmdGetChatId } from "./commands/cmdGetChatId.ts";
import { cmdGetFile } from "./commands/cmdGetFile.ts";
import { mustHaveReplyMiddleware } from "/src/utilities/middlewares/mustHaveReplyMiddleware.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { cmdCreateCommandAlias } from "./commands/cmdCreateCommandAlias.ts";

const skillModule: SkillModule = {
  name: "chat",
  description:
    "Commands to manage chat settings. Invoke admins, report messages, get the chat_id, set the chat title, get file urls and more.",
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
      middlewares: [mustHaveTextMiddleware],
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
      description: "Create a command alias.",
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
