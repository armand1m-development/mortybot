import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdForecast } from "./commands/cmdForecast.ts";
import { cmdTemperature } from "./commands/cmdTemperature.ts";
import { createWeatherApiMiddleware } from "./middlewares/createWeatherApiMiddleware/mod.ts";

export const name: SkillModule["name"] = "weather";

export const initializers: SkillModule["initializers"] = [];

export const middlewares: SkillModule["middlewares"] = [
  createWeatherApiMiddleware,
];

export const commands: SkillModule["commands"] = [
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
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
