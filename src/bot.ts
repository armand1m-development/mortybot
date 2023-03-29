import { getLogger } from "std/log/mod.ts";
import { resolve } from "std/path/posix.ts";
import { Bot, Context, enhanceStorage, session } from "grammy/mod.ts";
import { sequentialize } from "grammy_runner/mod.ts";
import { hydrateFiles } from "grammy_files/mod.ts";
import { FileAdapter } from "grammy_storages/file/src/mod.ts";

import { skills } from "/src/skills/skills.ts";
import { BotContext, SessionData } from "/src/context/mod.ts";
import { replacer, reviver } from "/src/utilities/jsonParsing.ts";
import { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import { setupSkillModulesLoader } from "/src/platform/skillModules/setupSkillModulesLoader.ts";
import { injectGlobalErrorHandler } from "/src/platform/errorHandling/globalErrorHandler.ts";
import { createConfigurationMiddleware } from "/src/platform/configuration/middlewares/createConfigurationMiddleware.ts";

export const createBot = async (configuration: Configuration) => {
  const bot = new Bot<BotContext>(configuration.botToken);

  const { createSessionData, loadSkills } = await setupSkillModulesLoader(
    skills,
    bot,
  );

  const getSessionKey = (ctx: Context) => {
    return ctx.chat?.id.toString();
  };

  const storage = new FileAdapter({
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
  });

  bot.api.config.use(hydrateFiles(bot.token));
  bot.use(createConfigurationMiddleware(configuration));
  bot.use(sequentialize(getSessionKey));
  bot.use(session({
    getSessionKey,
    initial: createSessionData,
    storage: enhanceStorage({
      storage,
      migrations: {
        1: (old: SessionData): SessionData => {
          console.log({
            message: 'running migration 1',
            old
          });

          return old;
        }
      }
    }),
  }));

  await loadSkills();

  injectGlobalErrorHandler(bot);

  return bot;
};
