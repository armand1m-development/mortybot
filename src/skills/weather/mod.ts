import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdForecast } from "./commands/cmdForecast.ts";
import { cmdTemperature } from "./commands/cmdTemperature.ts";
import { createWeatherApiMiddleware } from "./middlewares/createWeatherApiMiddleware/mod.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { textAssistantTool } from "/src/platform/skillModules/assistantTool.ts";

const skillModule: SkillModule = {
  name: "weather",
  description: "Commands to get weather information.",
  initializers: [],
  middlewares: [createWeatherApiMiddleware],
  commands: [
    {
      command: "forecast",
      aliases: ["previsao"],
      description: "Brings forecast for us",
      handler: cmdForecast,
      assistantTool: textAssistantTool("location", {
        argumentDescription: "The city or location whose forecast to fetch.",
      }),
      middlewares: [mustHaveTextMiddleware],
    },
    {
      command: "temperature",
      aliases: ["temp"],
      description: "Brings temperature for us",
      handler: cmdTemperature,
      assistantTool: textAssistantTool("location", {
        argumentDescription: "The city or location whose temperature to fetch.",
      }),
      middlewares: [mustHaveTextMiddleware],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: [],
  router: null,
};

export default skillModule;
