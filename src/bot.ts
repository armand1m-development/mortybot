import { getLogger } from "std/log/mod.ts";
import { resolve } from "std/path/posix.ts";
import { Bot, Context, session } from "grammy/mod.ts";
import { sequentialize } from "grammy_runner/mod.ts";
import { hydrateFiles } from "grammy_files/mod.ts";
import { FileAdapter } from "grammy_storages/file/src/mod.ts";
import { BotContext } from "/src/context/mod.ts";
import { replacer, reviver } from "/src/utilities/jsonParsing.ts";
import { Configuration } from "./platform/configuration/middlewares/types.ts";
import { createConfigurationMiddleware } from "./platform/configuration/middlewares/createConfigurationMiddleware.ts";
import { injectGlobalErrorHandler } from "./platform/errorHandling/globalErrorHandler.ts";
import { setupSkillModulesLoader } from "./platform/skillModules/setupSkillModulesLoader.ts";

import { skills } from "./skills/skills.ts";

export const createBot = async (configuration: Configuration) => {
  const bot = new Bot<BotContext>(configuration.botToken);

  const { createSessionData, loadSkills } = await setupSkillModulesLoader(
    skills,
    bot,
  );

  const getSessionKey = (ctx: Context) => {
    return ctx.chat?.id.toString() ?? ctx.inlineQuery?.from.id.toString();
  };

  bot.api.config.use(hydrateFiles(bot.token));
  bot.use(createConfigurationMiddleware(configuration));
  bot.use(sequentialize(getSessionKey));
  bot.use(session({
    getSessionKey,
    initial: createSessionData,
    storage: new FileAdapter({
      dirName: resolve(configuration.dataPath, "./sessions"),
      deserializer: (input) => {
        try {
          return JSON.parse(input, reviver);
        } catch (err) {
          getLogger().error(err);
          return {};
        }
      },
      serializer: (input) => {
        return JSON.stringify(input, replacer, `\t`);
      },
    }),
  }));

  await loadSkills();

  injectGlobalErrorHandler(bot);

  bot.on("inline_query", (ctx) => ctx.answerInlineQuery([]));

  return bot;
};
