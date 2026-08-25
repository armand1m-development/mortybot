import * as Sentry from "sentry";
import { getLogger } from "@std/log";
import type { Middleware } from "grammy";
import type { Filter } from "grammy";
import type { Bot } from "grammy";
import type { BotCommand } from "grammy/types";
import type { BotContext, SessionData } from "/src/context/mod.ts";
import type { Skill } from "/src/skills/skills.ts";
import type { SkillModule } from "./types/SkillModule.ts";
import { loadSkillModule } from "./loadSkill.ts";
import { Configuration } from "../configuration/middlewares/types.ts";
import { SkillCommandToolRegistry } from "./SkillCommandToolRegistry.ts";
import { createInstrumentedCommandHandler } from "./executeSkillCommand.ts";
import { fitBotCommandMenu } from "/src/utilities/array/fitBotCommandMenu.ts";

const logger = () => getLogger();

const isFulfilled = <T>(
  input: PromiseSettledResult<T>,
): input is PromiseFulfilledResult<T> => input.status === "fulfilled";

export const setupSkillModulesLoader = async (
  skills: readonly Skill[],
  bot: Bot<BotContext>,
  configuration: Configuration,
) => {
  const loadedSkillModules = await Promise.all(skills.map(loadSkillModule));
  const skillCommandTools = new SkillCommandToolRegistry();

  const createSessionData = () => {
    let initialSessionData: Partial<SessionData> = {};

    loadedSkillModules.forEach((skill) => {
      logger().debug(`Running "${skill.name}" session initializers..`);
      skill.sessionDataInitializers.forEach((initializer) => {
        initialSessionData = {
          ...initialSessionData,
          ...initializer(configuration),
        };
      });
    });

    return initialSessionData as SessionData;
  };

  const loadSkillMiddlewares = (skill: SkillModule) => {
    logger().debug(`Loading skill "${skill.name}" middlewares..`);
    skill.middlewares.forEach((createMiddleware) => {
      // TODO: consider properties to be injected
      // in every middleware loader, to enhance flexibility
      bot.use(createMiddleware());
    });
  };

  const loadSkillCommands = (skill: SkillModule) => {
    logger().debug(`Loading skill "${skill.name}" commands..`);
    skill.commands.forEach((skillCommand) => {
      const {
        command,
        aliases,
        middlewares,
        chatType,
      } = skillCommand;
      if (aliases.length === 0) {
        const logMessage =
          `Loading command "/${command}" for skill "${skill.name}"`;
        logger().info(logMessage);
      } else {
        const logMessage = `Loading command "/${command}" with aliases "${
          aliases.join(", ")
        }" for skill "${skill.name}"`;

        logger().info(logMessage);
      }

      const composer = chatType ? bot.chatType(chatType) : bot;
      composer.command(
        [command, ...aliases],
        ...(middlewares ?? []),
        createInstrumentedCommandHandler(skill.name, skillCommand),
      );
    });
  };

  const loadSkillListeners = (skill: SkillModule) => {
    logger().debug(`Loading skill "${skill.name}" listeners..`);

    for (const { event, handler, chatType } of skill.listeners) {
      // deno-lint-ignore no-explicit-any
      const wrappedHandler: Middleware<Filter<BotContext, any>> = async (
        ctx,
      ) => {
        const begin = performance.now();
        // @ts-ignore: the type is guaranteed in this case.
        const result: { handled: boolean } = await handler(ctx);
        const end = performance.now();
        const time = end - begin;

        if (result.handled) {
          // deno-lint-ignore ban-types
          const handlerName = (handler as Function).name ?? handler.toString();
          // @ts-ignore: the type is not guaranteed in this case, and it is fine.
          const text = ctx?.msg?.text;

          Sentry.metrics.count(`handled_listener_invocation`, 1, {
            attributes: {
              event,
              skill: skill.name,
              handlerName,
              chatType,
              text,
            },
          });

          Sentry.metrics.distribution(`handled_listener_duration`, time, {
            attributes: {
              event,
              handlerName,
              chatType,
              skill: skill.name,
              text,
            },
            unit: "millisecond",
          });
        }

        return result;
      };

      if (chatType !== undefined) {
        bot.chatType(chatType).fork().on(event, wrappedHandler);
      } else {
        bot.fork().on(event, wrappedHandler);
      }
    }
  };

  const loadSkillInlineQueryListeners = (skill: SkillModule) => {
    logger().debug(`Loading skill "${skill.name}" listeners..`);
    skill.inlineQueryListeners.forEach(({ pattern, handler }) => {
      bot.inlineQuery(pattern, handler);
    });
  };

  const runSkillInitializers = (skill: SkillModule) => {
    logger().debug(`Running skill "${skill.name}" initializers..`);
    return Promise.all(
      skill.initializers.map(async (initializer) => {
        const begin = performance.now();
        try {
          return await initializer(configuration);
        } finally {
          const end = performance.now();
          const time = end - begin;

          Sentry.metrics.distribution(`skill_initializer_duration`, time, {
            attributes: {
              skill: skill.name,
            },
            unit: "millisecond",
          });
        }
      }),
    );
  };

  const compileSkillCommandsToDocs = (skill: SkillModule) => {
    const commands = skill.commands.flatMap(
      ({ command, aliases, description }) => {
        const variants = [command, ...aliases];

        return variants.map((variantCommand): BotCommand => ({
          command: variantCommand,
          description,
        }));
      },
    );

    return commands;
  };

  const printSkillLoadingReport = (
    result: PromiseSettledResult<BotCommand[] | undefined>[],
    reportedSkills: SkillModule[],
  ) => {
    const skillLoadingReport = result.map((result, index) => {
      const skill = reportedSkills[index];
      const resumedSkill: Record<string, unknown> = { ...skill };

      resumedSkill.commands = skill.commands.map((command) =>
        `${command.command}: ${command.description}`
      );

      Object.entries(resumedSkill).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          delete resumedSkill[key];
        }

        if (value instanceof Array && value.length === 0) {
          delete resumedSkill[key];
        }

        if (value instanceof Array && value.length > 0) {
          resumedSkill[key] = value.map((valueItem: unknown) => {
            if (valueItem instanceof Function) {
              return valueItem.name ?? valueItem.toString();
            }

            return valueItem;
          });
        }

        if (value instanceof Function) {
          resumedSkill[key] = value.name ?? value.toString();
        }

        if (key === "migrations") {
          resumedSkill[key] = Object.values(value as object).map((
            migration: { name: string },
          ) => migration.name);
        }

        if (key === "inlineQueryListeners") {
          resumedSkill[key] = (value as SkillModule["inlineQueryListeners"])
            .map((
              { pattern, handler },
            ) =>
              `${pattern.toString()}: ${
                // deno-lint-ignore no-explicit-any
                (handler as any)?.name ?? handler?.toString()}`
            );
        }
      });

      return ({
        skill: resumedSkill,
        result,
      });
    });

    logger().debug("Skill loading report:");
    logger().debug(JSON.stringify(skillLoadingReport, null, 2));
  };

  const loadSkill = (skill: SkillModule) => {
    try {
      logger().debug(`Loading skill "${skill.name}"`);

      const begin = performance.now();

      loadSkillCommands(skill);
      loadSkillListeners(skill);
      loadSkillInlineQueryListeners(skill);

      const end = performance.now();
      const time = end - begin;

      Sentry.metrics.distribution(`skill_loading_duration`, time, {
        attributes: {
          skill: skill.name,
        },
        unit: "millisecond",
      });

      return compileSkillCommandsToDocs(skill);
    } catch (err) {
      logger().error(`Failed to load skill "${skill.name}".`);
      logger().error(err);
      return [];
    }
  };

  const loadSkills = async () => {
    const beginAll = performance.now();

    const initializerResults = await Promise.allSettled(
      loadedSkillModules.map(async (skill) => {
        try {
          await runSkillInitializers(skill);
          return skill;
        } catch (error) {
          logger().error(`Failed to initialize skill "${skill.name}".`);
          logger().error(error);
          throw error;
        }
      }),
    );
    const initializedSkills = initializerResults.flatMap((result) =>
      isFulfilled(result) ? [result.value] : []
    );

    // Context-producing middleware must be registered before any forked
    // listener (especially the assistant) can invoke another skill.
    for (const skill of initializedSkills) loadSkillMiddlewares(skill);

    const skillLoaderResults = await Promise.allSettled(
      initializedSkills.map(loadSkill),
    );
    const activeSkills = initializedSkills.filter((_, index) =>
      isFulfilled(skillLoaderResults[index])
    );
    skillCommandTools.registerSkills(activeSkills);

    const endAll = performance.now();
    const time = endAll - beginAll;

    Sentry.metrics.distribution(`all_skill_loading_duration`, time, {
      unit: "millisecond",
    });

    if (Deno.env.get("PRINT_SKILL_LOADING_REPORT") === "true") {
      printSkillLoadingReport(skillLoaderResults, initializedSkills);
    }

    const commands = skillLoaderResults.flatMap((result) => {
      return isFulfilled(result) ? result.value : [];
    });

    if (Deno.env.get("PRINT_BOT_COMMAND_DOCS_REPORT") === "true") {
      logger().debug("Setting bot command docs.");
      logger().debug(JSON.stringify(commands, null, 2));
    }

    // Telegram rejects an oversized menu with BOT_COMMANDS_TOO_MUCH, which
    // reads as a counting error while actually being a payload-size one;
    // without this trim that rejection kills the bot at startup.
    const fittedCommands = fitBotCommandMenu(commands);
    if (fittedCommands.length < commands.length) {
      const dropped = commands.slice(fittedCommands.length).map(
        ({ command }) => `/${command}`,
      );
      logger().warn(
        `Command menu exceeded Telegram's limits; dropped ${dropped.length} alias entries: ${
          dropped.join(", ")
        }.`,
      );
    }

    await bot.api.setMyCommands(fittedCommands);
  };

  return {
    createSessionData,
    loadSkills,
    skillCommandTools,
  };
};
