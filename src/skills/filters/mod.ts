import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import type { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import type { SessionData } from "/src/context/mod.ts";
import { createAddFilterCommand } from "./commands/createAddFilterCommand.ts";
import { getInitialFilterSessionData } from "./sessionData/getInitialFilterSessionData.ts";
import { filterListener } from "./listeners/filterListener.ts";
import { cmdListFilters } from "./commands/cmdListFilters.ts";
import { cmdSearchFilters } from "./commands/cmdSearchFilters.ts";
import { cmdListFilterOwners } from "./commands/cmdListFilterOwners.ts";
import { cmdStopFilter } from "./commands/cmdStopFilter.ts";
import { cmdActivateFilter } from "./commands/cmdActivateFilter.ts";
import { cmdDeleteFilter } from "./commands/cmdDeleteFilter.ts";
import { cmdCountPerOwner } from "./commands/cmdCountPerOwner.ts";
import { createDownloadsFolder } from "./initializers/createDownloadsFolder.ts";
import { searchListener } from "./inlineQueryListeners/searchListener.ts";
import { cmdToggleCaseSensitiveFilters } from "./commands/cmdToggleCaseSensitiveFilters.ts";
import { mustHaveReplyMiddleware } from "/src/utilities/middlewares/mustHaveReplyMiddleware.ts";
import {
  listingAssistantTool,
  noArgumentAssistantTool,
  textAssistantTool,
} from "/src/platform/skillModules/assistantTool.ts";

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
      assistantTool: listingAssistantTool(),
    },
    {
      command: "search_filters",
      aliases: ["find_filters"],
      description: "Search filters by trigger or content",
      handler: cmdSearchFilters,
      assistantTool: textAssistantTool("query", {
        inspectable: true,
        description:
          "Fulltext and fuzzy search over this chat's filters by trigger text and content. Chats can carry hundreds of filters, so prefer this over listing them all: it returns only the best matches, ranked by relevance, with each filter's media type and caption. The query language takes whitespace-separated terms that must all match, \"quoted phrases\" for exact wording, and -term to exclude. Matching ignores case and accents and tolerates typos in unquoted terms.",
        argumentDescription:
          'Search terms, e.g. `jassa cerveja -bolsonaro` or `"tem cerveja"`.',
      }),
    },
    {
      command: "filterowners",
      aliases: ["filterinfo"],
      description: "List filters with owner info",
      handler: cmdListFilterOwners,
      assistantTool: listingAssistantTool(),
    },
    {
      command: "add_filter",
      aliases: ["filter"],
      description: "Adds a new filter",
      handler: createAddFilterCommand({ isLoud: false }),
      assistantTool: textAssistantTool("trigger", {
        effect: "write",
        description:
          "Add a filter whose response is the message that the user's request is replying to.",
        argumentDescription: "The text trigger for the filter.",
      }),
      middlewares: [mustHaveReplyMiddleware],
    },
    {
      command: "add_loud_filter",
      aliases: ["loud_filter"],
      description: "Adds a new loud filter.",
      handler: createAddFilterCommand({ isLoud: true }),
      assistantTool: textAssistantTool("trigger", {
        effect: "write",
        description:
          "Add a loud filter whose response is the message that the user's request is replying to.",
        argumentDescription: "The text trigger for the loud filter.",
      }),
      middlewares: [mustHaveReplyMiddleware],
    },
    {
      command: "stop_filter",
      aliases: [],
      description: "Stops listening to an existing filter",
      handler: cmdStopFilter,
      assistantTool: textAssistantTool("trigger", { effect: "write" }),
    },
    {
      command: "activate_filter",
      aliases: [],
      description: "Starts listening to an existing filter",
      handler: cmdActivateFilter,
      assistantTool: textAssistantTool("trigger", { effect: "write" }),
    },
    {
      command: "delete_filter",
      aliases: [],
      description: "Deletes a filter permanently",
      handler: cmdDeleteFilter,
      assistantTool: textAssistantTool("trigger", { effect: "write" }),
    },
    {
      command: "filterownercount",
      aliases: [],
      description: "Count of filters per owner",
      handler: cmdCountPerOwner,
      assistantTool: noArgumentAssistantTool(),
    },
    {
      command: "toggle_case_sensitive_filters",
      aliases: [],
      description: "Toggles case sensitiviness for filters in this chat.",
      handler: cmdToggleCaseSensitiveFilters,
      assistantTool: noArgumentAssistantTool("write"),
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
