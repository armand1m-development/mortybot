import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { table as funTextTable } from "./commands/cmdFunText.ts";
import { table as crazyTextTable } from "./commands/cmdCrazyText.ts";
import {
  reverseTable as teluguReverseTable,
  table as teluguTextTable,
} from "./commands/cmdTeluguText.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import {
  createMultipleTextCommand,
  createTextCommand,
} from "./utilities/createTextCommand.ts";

const skillModule: SkillModule = {
  name: "text",
  description: "Commands that convert text into funny characters.",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "funtext",
      aliases: ["fun", "funtxt", "kawaii"],
      description: "Converts a text string into funny characters.",
      handler: createTextCommand(funTextTable),
      middlewares: [mustHaveTextMiddleware],
    },
    {
      command: "crazytext",
      aliases: ["crazify", "crazytxt"],
      description: "Converts a text string into crazy characters.",
      handler: createMultipleTextCommand(crazyTextTable),
      middlewares: [mustHaveTextMiddleware],
    },
    {
      command: "telugutext",
      aliases: ["telugu", "telugutxt"],
      description: "Converts a text string into telugu characters.",
      handler: createTextCommand(teluguTextTable),
      middlewares: [mustHaveTextMiddleware],
    },
    {
      command: "decodetelugutext",
      aliases: ["decodetelugu"],
      description: "Decodes telugu characters.",
      handler: createTextCommand(teluguReverseTable),
      middlewares: [mustHaveTextMiddleware],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
