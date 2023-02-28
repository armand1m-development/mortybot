import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdConvert } from "./commands/cmdConvert.ts";
import { createCurrencyApiMiddleware } from "./middlewares/createCurrencyApiMiddleware/mod.ts";
import { cmdUSDtoBRL } from "./commands/cmdUSDtoBRL.ts";
import { cmdEURtoBRL } from "./commands/cmdEURtoBRL.ts";

export const name: SkillModule["name"] = "currency";
export const initializers: SkillModule["initializers"] = [];
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
  {
    command: "dolar",
    aliases: [],
    description: "1 USD to BRL",
    handler: cmdUSDtoBRL,
  },
  {
    command: "euro",
    aliases: [],
    description: "1 EUR to BRL",
    handler: cmdEURtoBRL,
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];
