import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdCalculate } from "./commands/cmdCalculate.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";

const skillModule: SkillModule = {
  name: "math",
  description:
    "Commands to calculate math expressions, exchange rates, metrics and more.",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "calc",
      aliases: ["calculate"],
      description: "Evaluates a math expression and gives you the result.",
      handler: cmdCalculate,
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
