import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { cmdGetIncomeReport } from "./commands/cmdGetIncomeReport.ts";
import * as queryString from "querystring";
import {
  assistantToolObjectSchema,
  createAssistantTool,
  requireNumberArgument,
} from "/src/platform/skillModules/assistantTool.ts";

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
      assistantTool: createAssistantTool(
        assistantToolObjectSchema({
          income: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Gross yearly income in euros.",
          },
          year: { type: "integer", description: "Tax year." },
          ruling: { type: "boolean", description: "Apply the 30% ruling." },
          allowance: { type: "boolean" },
          socialSecurity: { type: "boolean" },
          hours: { type: "number", exclusiveMinimum: 0 },
        }, ["income"]),
        (args) => {
          const income = requireNumberArgument(args, "income");
          if (income <= 0) throw new TypeError("Income must be positive.");
          const allowed = [
            "income",
            "year",
            "ruling",
            "allowance",
            "socialSecurity",
            "hours",
          ];
          const parameters: Record<string, string> = { income: String(income) };
          for (const name of allowed.slice(1)) {
            const value = args[name];
            if (value !== undefined) parameters[name] = String(value);
          }
          return queryString.stringify(parameters);
        },
      ),
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
