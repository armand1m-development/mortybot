import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdForecast } from "./commands/cmdForecast.ts";
import { cmdTemperature } from "./commands/cmdTemperature.ts";
import { createWeatherApiMiddleware } from "./middlewares/createWeatherApiMiddleware/mod.ts";

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
    },
    {
      command: "temperature",
      aliases: ["temp"],
      description: "Brings temperature for us",
      handler: cmdTemperature,
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: [],
  router: null,
};

export default skillModule;
