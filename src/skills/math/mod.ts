import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdCalculate } from "./commands/cmdCalculate.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { rateLimitCalculations } from "./middlewares/rateLimitCalculations.ts";
import { textAssistantTool } from "/src/platform/skillModules/assistantTool.ts";

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
      assistantTool: textAssistantTool("expression", {
        argumentDescription: "The mathematical expression to evaluate.",
      }),
      middlewares: [rateLimitCalculations, mustHaveTextMiddleware],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
