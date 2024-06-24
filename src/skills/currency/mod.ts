import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createCurrencyApiMiddleware } from "./middlewares/createCurrencyApiMiddleware/mod.ts";
import { cmdConvert } from "./commands/cmdConvert.ts";
import { cmdUSDtoBRL } from "./commands/cmdUSDtoBRL.ts";
import { cmdEURtoBRL } from "./commands/cmdEURtoBRL.ts";

const skillModule: SkillModule = {
  name: "currency",
  initializers: [],
  middlewares: [createCurrencyApiMiddleware],
  commands: [
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
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
