import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createLocationsApiMiddleware } from "./middlewares/createLocationsApiMiddleware/mod.ts";
import { cmdSuggest } from "./commands/cmdSuggest.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { mustHaveLocationReplyMiddleware } from "/src/utilities/middlewares/mustHaveLocationReplyMiddleware.ts";
import { textAssistantTool } from "/src/platform/skillModules/assistantTool.ts";

const skillModule: SkillModule = {
  name: "horeca",
  description: "Commands to suggest bars or restaurants.",
  initializers: [],
  middlewares: [createLocationsApiMiddleware],
  commands: [
    {
      command: "suggest",
      aliases: [],
      description:
        "Gives a suggestion of bars or restaurants within the range of a mentioned location point",
      handler: cmdSuggest,
      assistantTool: textAssistantTool("keyword", {
        description:
          "Suggest bars or restaurants near the location in the message that the user's request is replying to.",
        argumentDescription:
          "What kind of place to find, such as restaurant, bar, pizza, or cafe.",
      }),
      middlewares: [mustHaveTextMiddleware, mustHaveLocationReplyMiddleware],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
