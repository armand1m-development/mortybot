import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { cmdGetIncomeReport } from "./commands/cmdGetIncomeReport.ts";

const skillModule: SkillModule = {
  name: "taxincome",
  description: "Commands to get info on tax reports, income reports, etc.",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "get_income_report",
      aliases: ["thetax", "tax"],
      description:
        "Usage: /get_income_report income=36000&allowance=true&socialSecurity=true",
      handler: cmdGetIncomeReport,
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
