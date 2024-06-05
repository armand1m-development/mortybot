import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createLocationsApiMiddleware } from "./middlewares/createLocationsApiMiddleware/mod.ts";
import { cmdSuggest } from "./commands/cmdSuggest.ts";

const skillModule: SkillModule = {
  name: "horeca",
  initializers: [],
  middlewares: [createLocationsApiMiddleware],
  commands: [
    {
      command: "suggest",
      aliases: [],
      description:
        "Gives a suggestion of bars or restaurants within the range of a mentioned location point",
      handler: cmdSuggest,
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
