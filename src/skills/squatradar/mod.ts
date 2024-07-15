import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { cmdGetNextSquatEvents } from "./commands/cmdGetNextSquatEvents.ts";
import { mustHaveTextMiddleware } from "/src/utilities/middlewares/mustHaveTextMiddleware.ts";
import { createRadarSquatApiMiddlerware } from "./middlewares/createRadarSquatApiMiddleware/mod.ts";

const skillModule: SkillModule = {
  name: "squatradar",
  description:
    "Commands related to searching and serving data from radar.squat.net through their api.",
  initializers: [],
  middlewares: [createRadarSquatApiMiddlerware],
  commands: [
    {
      command: "squatevents",
      aliases: [],
      description:
        "Gets the next 20 events from radar.squat.net based on the city provided.",
      handler: cmdGetNextSquatEvents,
      middlewares: [mustHaveTextMiddleware],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
