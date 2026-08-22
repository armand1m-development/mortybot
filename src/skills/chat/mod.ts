import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdReport } from "./commands/cmdReport.ts";
import { cmdSetTitle } from "./commands/cmdSetTitle.ts";
import { cmdGetChatId } from "./commands/cmdGetChatId.ts";
import { cmdGetFile } from "./commands/cmdGetFile.ts";
import { mustHaveReplyMiddleware } from "/src/utilities/middlewares/mustHaveReplyMiddleware.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { cmdCreateCommandAlias } from "./commands/cmdCreateCommandAlias.ts";
import {
  noArgumentAssistantTool,
  textAssistantTool,
} from "/src/platform/skillModules/assistantTool.ts";

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
      assistantTool: textAssistantTool("title", {
        effect: "write",
        argumentDescription: "The new chat title.",
      }),
      chatType: ["group", "supergroup"],
      middlewares: [mustHaveTextMiddleware],
    },
    {
      command: "report",
      aliases: ["admin"],
      description: "Pings the group admin about the replied message.",
      handler: cmdReport,
      assistantTool: noArgumentAssistantTool(
        "write",
        "Report the message that the user's request is replying to and notify the group administrators.",
      ),
      chatType: ["group", "supergroup"],
      middlewares: [mustHaveReplyMiddleware],
    },
    {
      command: "chat_id",
      aliases: ["id"],
      description: "Gets the chat id.",
      handler: cmdGetChatId,
      assistantTool: noArgumentAssistantTool(),
    },
    {
      command: "get_file",
      aliases: ["get_sticker"],
      description: "Gets the file and url from a sticker, video note or gif.",
      handler: cmdGetFile,
      assistantTool: noArgumentAssistantTool(
        "read",
        "Get the file and URL from the sticker, video note, GIF, or other supported media that the user's request is replying to.",
      ),
      middlewares: [mustHaveReplyMiddleware],
    },
    {
      command: "create_command_alias",
      aliases: ["cmd", "alias"],
      description: "Create a command alias.",
      handler: cmdCreateCommandAlias,
      assistantTool: noArgumentAssistantTool(
        "write",
        "Create a command alias from the message that the user's request is replying to. This command may report that it is not implemented.",
      ),
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
