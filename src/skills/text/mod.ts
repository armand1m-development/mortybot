import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdFunText } from "./commands/cmdFunText.ts";

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
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
