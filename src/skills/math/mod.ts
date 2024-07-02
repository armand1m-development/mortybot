import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdCalculate } from "./commands/cmdCalculate.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { mustBeValidMathExpression } from "./middlewares/mustBeValidMathExpression.ts";
import { createExchangeRateCache } from "./initializers/createExchangeRateCache.ts";
import { createExchangeRateCacheMiddleware } from "./middlewares/createExchangeRateCacheMiddleware.ts";

const skillModule: SkillModule = {
  name: "math",
  initializers: [createExchangeRateCache],
  middlewares: [createExchangeRateCacheMiddleware],
  commands: [
    {
      command: "calc",
      aliases: ["calculate"],
      description: "Evaluates a math expression and gives you the result.",
      handler: cmdCalculate,
      middlewares: [mustHaveTextMiddleware, mustBeValidMathExpression],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
