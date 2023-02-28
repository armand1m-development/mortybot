import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdConvert } from "./commands/cmdConvert.ts";
import { createCurrencyApiMiddleware } from "./middlewares/createCurrencyApiMiddleware/mod.ts";

export const name: SkillModule["name"] = "currency";

export const middlewares: SkillModule["middlewares"] = [
  createCurrencyApiMiddleware,
];

export const commands: SkillModule["commands"] = [
  {
    command: "convert",
    aliases: [],
    description: "Convert a value in one currency to another.",
    handler: cmdConvert,
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];
