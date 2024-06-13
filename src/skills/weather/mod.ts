import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdForecast } from "./commands/cmdForecast.ts";
import { cmdTemperature } from "./commands/cmdTemperature.ts";
import { createWeatherApiMiddleware } from "./middlewares/createWeatherApiMiddleware/mod.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";

const skillModule: SkillModule = {
  name: "weather",
  initializers: [],
  middlewares: [createWeatherApiMiddleware],
  commands: [
    {
      command: "forecast",
      aliases: ["previsao"],
      description: "Brings forecast for us",
      handler: cmdForecast,
      middlewares: [mustHaveTextMiddleware],
    },
    {
      command: "temperature",
      aliases: ["temp"],
      description: "Brings temperature for us",
      handler: cmdTemperature,
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
