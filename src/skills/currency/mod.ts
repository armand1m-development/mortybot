import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createCurrencyApiMiddleware } from "./middlewares/createCurrencyApiMiddleware/mod.ts";
import { cmdConvert } from "./commands/cmdConvert.ts";
import { cmdUSDtoBRL } from "./commands/cmdUSDtoBRL.ts";
import { cmdEURtoBRL } from "./commands/cmdEURtoBRL.ts";
import {
  assistantToolObjectSchema,
  createAssistantTool,
  noArgumentAssistantTool,
  requireNumberArgument,
  requireStringArgument,
} from "/src/platform/skillModules/assistantTool.ts";

const skillModule: SkillModule = {
  name: "currency",
  description: "Commands to convert currencies.",
  initializers: [],
  middlewares: [createCurrencyApiMiddleware],
  commands: [
    {
      command: "convert",
      aliases: [],
      description: "Convert a value in one currency to another.",
      handler: cmdConvert,
      assistantTool: createAssistantTool(
        assistantToolObjectSchema({
          amount: { type: "integer", description: "Amount to convert." },
          fromCurrency: {
            type: "string",
            description: "Three-letter source currency code, such as USD.",
            pattern: "^[A-Za-z]{3}$",
          },
          toCurrency: {
            type: "string",
            description: "Three-letter target currency code, such as BRL.",
            pattern: "^[A-Za-z]{3}$",
          },
        }, ["amount", "fromCurrency", "toCurrency"]),
        (args) => {
          const amount = requireNumberArgument(args, "amount");
          if (!Number.isInteger(amount)) {
            throw new TypeError("Currency amount must be an integer.");
          }
          const from = requireStringArgument(args, "fromCurrency")
            .toUpperCase();
          const to = requireStringArgument(args, "toCurrency").toUpperCase();
          if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
            throw new TypeError("Currency codes must contain three letters.");
          }
          return `${amount} ${from} to ${to}`;
        },
      ),
    },
    {
      command: "dolar",
      aliases: [],
      description: "1 USD to BRL",
      handler: cmdUSDtoBRL,
      assistantTool: noArgumentAssistantTool(),
    },
    {
      command: "euro",
      aliases: [],
      description: "1 EUR to BRL",
      handler: cmdEURtoBRL,
      assistantTool: noArgumentAssistantTool(),
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
