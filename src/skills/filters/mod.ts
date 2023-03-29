import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { createAddFilterCommand } from "./commands/createAddFilterCommand.ts";
import { getInitialFilterSessionData } from "./sessionData/getInitialFilterSessionData.ts";
import { filterListener } from "./listeners/filterListener.ts";
import { cmdListFilters } from "./commands/cmdListFilters.ts";
import { cmdListFilterOwners } from "./commands/cmdListFilterOwners.ts";
import { cmdStopFilter } from "./commands/cmdStopFilter.ts";
import { cmdActivateFilter } from "./commands/cmdActivateFilter.ts";
import { cmdDeleteFilter } from "./commands/cmdDeleteFilter.ts";
import { createDownloadsFolder } from "./initializers/createDownloadsFolder.ts";
import { filterSearchListener } from "./inlineQueryListeners/filterSearchListener.ts";

export const name: SkillModule["name"] = "filters";
export const initializers: SkillModule["initializers"] = [
  createDownloadsFolder,
];

export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "filters",
    aliases: [],
    description: "List all filters",
    handler: cmdListFilters,
  },
  {
    command: "filterowners",
    aliases: ["filterinfo"],
    description: "List filters with owner info",
    handler: cmdListFilterOwners,
  },
  {
    command: "add_filter",
    aliases: ["filter"],
    description: "Adds a new filter",
    handler: createAddFilterCommand({ isLoud: false }),
  },
  {
    command: "add_loud_filter",
    aliases: ["loud_filter"],
    description: "Adds a new loud filter.",
    handler: createAddFilterCommand({ isLoud: true }),
  },
  {
    command: "stop_filter",
    aliases: [],
    description: "Stops listening to an existing filter",
    handler: cmdStopFilter,
  },
  {
    command: "activate_filter",
    aliases: [],
    description: "Starts listening to an existing filter",
    handler: cmdActivateFilter,
  },
  {
    command: "delete_filter",
    aliases: [],
    description: "Deletes a filter permanently",
    handler: cmdDeleteFilter,
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

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [
  {
    pattern: /^filters\s*(.*)$/,
    handler: filterSearchListener,
  },
];
