import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createRodosolApiMiddleware } from "./middlewares/createRodosolApiMiddleware/mod.ts";
import { cmdRodosolNow } from "./commands/cmdRodosolNow.ts";
import { cmdTerceiraPonteNow } from "./commands/cmdTerceiraPonteNow.ts";

const skillModule: SkillModule = {
  name: "espiritosanto",
  description:
    "Commands to get information about the cameras of the roads of Espírito Santo. _(deprecated since Rodosol is not supplying these anymore)_",
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
