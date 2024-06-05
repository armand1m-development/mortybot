import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createRodosolApiMiddleware } from "./middlewares/createRodosolApiMiddleware/mod.ts";
import { cmdRodosolNow } from "./commands/cmdRodosolNow.ts";
import { cmdTerceiraPonteNow } from "./commands/cmdTerceiraPonteNow.ts";

const skillModule: SkillModule = {
  name: "espiritosanto",
  initializers: [],
  middlewares: [createRodosolApiMiddleware],
  commands: [
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
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
