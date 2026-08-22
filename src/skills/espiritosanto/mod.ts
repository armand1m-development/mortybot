import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createRodosolApiMiddleware } from "./middlewares/createRodosolApiMiddleware/mod.ts";
import { cmdRodosolNow } from "./commands/cmdRodosolNow.ts";
import { cmdTerceiraPonteNow } from "./commands/cmdTerceiraPonteNow.ts";
import { noArgumentAssistantTool } from "/src/platform/skillModules/assistantTool.ts";

const skillModule: SkillModule = {
  name: "espiritosanto",
  description: "Commands to get live road camera images from Espírito Santo.",
  initializers: [],
  middlewares: [createRodosolApiMiddleware],
  commands: [
    {
      command: "rodosol_now",
      aliases: [],
      description: "Fetch Vila Velha's Rodosol Road camera pictures now.",
      handler: cmdRodosolNow,
      assistantTool: noArgumentAssistantTool(),
    },
    {
      command: "tp_now",
      aliases: [],
      description: "Fetch Vila Velha's Third Bridge camera pictures now.",
      handler: cmdTerceiraPonteNow,
      assistantTool: noArgumentAssistantTool(),
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
