import { SkillModule } from "../../types/SkillModule.ts";
import { cmdAddFilter } from "./commands/cmdAddFilter.ts";
import { getInitialFilterSessionData } from "./sessionData/getInitialFilterSessionData.ts";

export const name: SkillModule["name"] = "filters";

export const middlewares: SkillModule["middlewares"] = [];

export const commands: SkillModule["commands"] = [
  {
    command: "add_filter",
    aliases: [],
    description: "Adds a new filter",
    handler: cmdAddFilter,
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] = [
  getInitialFilterSessionData,
];
