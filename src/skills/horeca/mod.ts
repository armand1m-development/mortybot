import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createLocationsApiMiddleware } from "./middlewares/createLocationsApiMiddleware/mod.ts";
import { cmdSuggest } from "./commands/cmdSuggest.ts";

export const name: SkillModule["name"] = "horeca";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [
  createLocationsApiMiddleware,
];
export const commands: SkillModule["commands"] = [
  {
    command: "suggest",
    aliases: [],
    description:
      "Gives a suggestion of bars or restaurants within the range of a mentioned location point",
    handler: cmdSuggest,
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
