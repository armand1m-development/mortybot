import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createRodosolApiMiddleware } from "./middlewares/createRodosolApiMiddleware/mod.ts";
import { cmdRodosolNow } from "./commands/cmdRodosolNow.ts";
import { cmdTerceiraPonteNow } from "./commands/cmdTerceiraPonteNow.ts";

export const name: SkillModule["name"] = "espiritosanto";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [
  createRodosolApiMiddleware,
];
export const commands: SkillModule["commands"] = [
  {
    command: "rodosol_now",
    aliases: [],
    description: "Fetch Vila Velha's Rodosol Road camera pictures now.",
    handler: cmdRodosolNow,
  },
  {
    command: "tp_now",
    aliases: [],
    description: "Fetch Vila Velha's Third Bridge camera pictures now.",
    handler: cmdTerceiraPonteNow,
  },
];
export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];
export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
