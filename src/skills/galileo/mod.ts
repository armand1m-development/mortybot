import { nextIssPasses } from "./commands/nextIssPasses.ts";
import { createN2yoMiddleware } from "./middleware/createN2yoMiddleware/mod.ts";
import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";

const skillModule: SkillModule = {
  name: "galileo",
  initializers: [],
  middlewares: [createN2yoMiddleware],
  commands: [
    {
      command: "iss",
      aliases: [],
      description:
        "Show the prediction for the next 3 days of watchable iss passes into the informed location. Example: /iss -20.316839,-40.309921",
      handler: nextIssPasses,
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
