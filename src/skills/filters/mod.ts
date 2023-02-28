import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { cmdAddFilter } from "./commands/cmdAddFilter.ts";
import { getInitialFilterSessionData } from "./sessionData/getInitialFilterSessionData.ts";
import { cmdListFilters } from "./commands/cmdListFilters.ts";
import { filterListener } from "./listeners/filterLIstener.ts";

export const name: SkillModule["name"] = "filters";

export const middlewares: SkillModule["middlewares"] = [];

export const commands: SkillModule["commands"] = [
  {
    command: "filters",
    aliases: [],
    description: "List all filters",
    handler: cmdListFilters,
  },
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

export const listeners: SkillModule["listeners"] = [
  <SkillListener<"message:text">> {
    event: "message:text",
    description:
      "This listener checks and replies messages that match defined filters",
    handler: filterListener,
  },
];
