import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdFunText } from "./commands/cmdFunText.ts";
import { cmdCrazyText } from "./commands/cmdCrazyText.ts";

const skillModule: SkillModule = {
  name: "text",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "funtext",
      aliases: ["fun", "funtxt", "kawaii"],
      description: "Converts a text string into funny characters.",
      handler: cmdFunText,
      chatType: ["group", "supergroup"],
    },
    {
      command: "crazytext",
      aliases: ["crazify", "crazytxt"],
      description: "Converts a text string into crazy characters.",
      handler: cmdCrazyText,
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
