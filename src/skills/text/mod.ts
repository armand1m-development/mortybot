import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdFunText } from "./commands/cmdFunText.ts";
import { cmdCrazyText } from "./commands/cmdCrazyText.ts";

export const name: SkillModule["name"] = "text";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
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
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
