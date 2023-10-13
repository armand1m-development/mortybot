import { nextIssPasses } from "./commands/nextIssPasses.ts";
import { createN2yoMiddleware } from "./middleware/createN2yoMiddleware/mod.ts";
import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";

export const name: SkillModule["name"] = "galileo";

export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [createN2yoMiddleware];
export const commands: SkillModule["commands"] = [
  {
    command: "iss",
    aliases: [],
    description:
      "Show the prediction for the next 3 days of watchable iss passes into the informed location. Example: /iss -20.316839,-40.309921",
    handler: nextIssPasses,
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];
export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
