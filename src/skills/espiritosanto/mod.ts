import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { createThirdBridgeApiMiddleware } from "./middlewares/createThirdBridgeApiMiddleware/mod.ts";
import { cmdTerceiraPonteNow } from "./commands/cmdTerceiraPonteNow.ts";
import { liveSnapshotAssistantTool } from "/src/platform/skillModules/assistantTool.ts";

const skillModule: SkillModule = {
  name: "espiritosanto",
  description: "Commands to get live road camera images from Espírito Santo.",
  initializers: [],
  middlewares: [createThirdBridgeApiMiddleware],
  commands: [
    {
      command: "tp_now",
      aliases: [],
      description: "Fetch Vila Velha's Third Bridge camera pictures now.",
      handler: cmdTerceiraPonteNow,
      assistantTool: liveSnapshotAssistantTool(
        "Fetch Vila Velha's Terceira Ponte (Third Bridge) road camera pictures and post them to the chat. Triggered by any question about current bridge conditions, in Portuguese or English: 'como ta a terceira ponte', 'como está a ponte', 'trânsito na terceira ponte', 'ponte agora', 'terceira ponte', 'third bridge', 'bridge traffic', 'how is the bridge'. Read-only and free: call it immediately when asked — never ask permission first and never answer from memory.",
      ),
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
