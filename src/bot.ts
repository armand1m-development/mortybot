import { getLogger } from "@std/log";
import { run } from "@grammyjs/runner";
import { resolve } from "@std/path/posix";
import { Bot, type Context, enhanceStorage, session } from "grammy";
import { sequentialize } from "@grammyjs/runner";
import { hydrateFiles } from "@grammyjs/files";
import { FileAdapter } from "@grammyjs/storage-file";
import type { BotContext, SessionData } from "/src/context/mod.ts";
import { replacer, reviver } from "/src/utilities/jsonParsing.ts";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import { createConfigurationMiddleware } from "/src/platform/configuration/middlewares/createConfigurationMiddleware.ts";
import { injectGlobalErrorHandler } from "/src/platform/errorHandling/globalErrorHandler.ts";
import { setupSkillModulesLoader } from "/src/platform/skillModules/setupSkillModulesLoader.ts";
import { autoRetry } from "@grammyjs/auto-retry";

import { skills } from "/src/skills/skills.ts";
import { setupSkillMigrationLoader } from "/src/platform/skillModules/setupSkillMigrationLoader.ts";
import { createI18nMiddleware } from "/src/i18n/createI18nMiddleware.ts";
import { getSafeErrorSummary } from "/src/utilities/sanitizeLogText.ts";

export const BOT_RUNNER_CONCURRENCY = 32;
export const BOT_UPDATE_TIMEOUT_MS = 120_000;

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
      storage: new FileAdapter<SessionData>({
        dirName: resolve(configuration.dataPath, "./sessions"),
        deserializer: (input: string): SessionData => {
          try {
            return JSON.parse(input, reviver);
          } catch (err) {
            getLogger().error(err);
            return {} as SessionData;
          }
        },
        serializer: (input: SessionData): string => {
          return JSON.stringify(input, replacer, `\t`);
        },
      }),
    }),
  }));
  bot.use(createI18nMiddleware());

  await loadSkills();

  injectGlobalErrorHandler(bot);

  const start = () => {
    return run(bot, {
      sink: {
        concurrency: BOT_RUNNER_CONCURRENCY,
        timeout: {
          milliseconds: BOT_UPDATE_TIMEOUT_MS,
          handler: (update, task) => {
            getLogger().warn(
              `Timed out while handling update ${update.update_id}.`,
            );
            task.catch((error) => {
              getLogger().error(
                `Timed-out update eventually failed: ${
                  getSafeErrorSummary(error)
                }`,
              );
            });
          },
        },
      },
    });
  };

  return {
    bot,
    start,
    configuration,
  };
};
