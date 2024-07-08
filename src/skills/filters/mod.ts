import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import type { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import type { SessionData } from "/src/context/mod.ts";
import { createAddFilterCommand } from "./commands/createAddFilterCommand.ts";
import { getInitialFilterSessionData } from "./sessionData/getInitialFilterSessionData.ts";
import { filterListener } from "./listeners/filterListener.ts";
import { cmdListFilters } from "./commands/cmdListFilters.ts";
import { cmdListFilterOwners } from "./commands/cmdListFilterOwners.ts";
import { cmdStopFilter } from "./commands/cmdStopFilter.ts";
import { cmdActivateFilter } from "./commands/cmdActivateFilter.ts";
import { cmdDeleteFilter } from "./commands/cmdDeleteFilter.ts";
import { cmdCountPerOwner } from "./commands/cmdCountPerOwner.ts";
import { createDownloadsFolder } from "./initializers/createDownloadsFolder.ts";
import { searchListener } from "./inlineQueryListeners/searchListener.ts";
import { cmdToggleCaseSensitiveFilters } from "./commands/cmdToggleCaseSensitiveFilters.ts";
import { mustHaveReplyMiddleware } from "/src/utilities/middlewares/mustHaveReplyMiddleware.ts";

const skillModule: SkillModule = {
  name: "filters",
  description:
    "Commands to filter messages and react with other messages to it.",
  initializers: [createDownloadsFolder],
  middlewares: [],
  commands: [
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
      middlewares: [mustHaveReplyMiddleware],
    },
    {
      command: "add_loud_filter",
      aliases: ["loud_filter"],
      description: "Adds a new loud filter.",
      handler: createAddFilterCommand({ isLoud: true }),
      middlewares: [mustHaveReplyMiddleware],
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
    {
      command: "filterownercount",
      aliases: [],
      description: "Count of filters per owner",
      handler: cmdCountPerOwner,
    },
    {
      command: "toggle_case_sensitive_filters",
      aliases: [],
      description: "Toggles case sensitiviness for filters in this chat.",
      handler: cmdToggleCaseSensitiveFilters,
    },
  ],
  sessionDataInitializers: [getInitialFilterSessionData],
  listeners: [
    <SkillListener<"message:text">> {
      event: "message:text",
      description:
        "This listener checks and replies messages that match defined filters",
      handler: filterListener,
    },
  ],
  inlineQueryListeners: [
    {
      pattern: /^.*$/,
      handler: searchListener,
    },
  ],
  migrations: {
    1717523761990: function addFilterSettings(old: SessionData): SessionData {
      const newSessionData: SessionData = { ...old };
      newSessionData.filterSettings = old?.filterSettings ?? {};
      newSessionData.filterSettings.caseSensitive =
        old?.filterSettings?.caseSensitive || true;
      return newSessionData;
    },
  },
  router: null,
};

export default skillModule;
