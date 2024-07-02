import { getLogger } from "std/log/mod.ts";
import { run } from "grammy_runner/mod.ts";
import { resolve } from "std/path/posix.ts";
import { Bot, type Context, enhanceStorage, session } from "grammy/mod.ts";
import { sequentialize } from "grammy_runner/mod.ts";
import { hydrateFiles } from "grammy_files/mod.ts";
import { FileAdapter } from "grammy_storages/file/src/mod.ts";
import type { BotContext } from "/src/context/mod.ts";
import { replacer, reviver } from "/src/utilities/jsonParsing.ts";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import { createConfigurationMiddleware } from "/src/platform/configuration/middlewares/createConfigurationMiddleware.ts";
import { injectGlobalErrorHandler } from "/src/platform/errorHandling/globalErrorHandler.ts";
import { setupSkillModulesLoader } from "/src/platform/skillModules/setupSkillModulesLoader.ts";
import { autoRetry } from "grammy_auto_retry/mod.ts";

import { skills } from "/src/skills/skills.ts";
import { setupSkillMigrationLoader } from "/src/platform/skillModules/setupSkillMigrationLoader.ts";

export const createBot = async (configuration: Configuration) => {
  const bot = new Bot<BotContext>(configuration.botToken);

  const { createSessionData, loadSkills } = await setupSkillModulesLoader(
    skills,
    bot,
    configuration,
  );

  const getSessionKey = (ctx: Context) => {
    return ctx.chat?.id.toString() ?? configuration.inlineQuerySourceChatId;
  };

  const migrationLoader = await setupSkillMigrationLoader(skills);
  const migrations = migrationLoader.loadSkillMigrations();

  bot.api.config.use(hydrateFiles(bot.token));
  bot.api.config.use(autoRetry({
    maxRetryAttempts: 5,
  }));
  bot.use(createConfigurationMiddleware(configuration));
  bot.use(sequentialize(getSessionKey));
  bot.use(session({
    getSessionKey,
    initial: createSessionData,
    storage: enhanceStorage({
      migrations,
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
    }),
  }));

  await loadSkills();

  injectGlobalErrorHandler(bot);

  const start = () => {
    return run(bot);
  };

  return {
    bot,
    start,
    configuration,
  };
};
