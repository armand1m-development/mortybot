import * as Sentry from "sentry";
import { Composer, type MiddlewareFn } from "grammy";
import type { Message } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";
import type { SkillCommand } from "./types/SkillCommand.ts";

export const createInstrumentedCommandHandler = (
  skillName: string,
  command: SkillCommand,
): MiddlewareFn<BotContext> => {
  return async (ctx) => {
    Sentry.metrics.count("command_invocation", 1, {
      attributes: {
        skill: skillName,
        command: command.command,
        match: typeof ctx.match === "string" ? ctx.match : undefined,
      },
    });

    const begin = performance.now();
    try {
      // The command predicate or tool-context proxy guarantees CommandContext.
      // @ts-ignore: narrowed at both call sites.
      return await command.handler(ctx);
    } finally {
      Sentry.metrics.distribution(
        "command_duration",
        performance.now() - begin,
        {
          attributes: { skill: skillName, command: command.command },
          unit: "millisecond",
        },
      );
    }
  };
};

const createCommandContext = (
  ctx: BotContext,
  command: string,
  input: string,
  sourceMessage?: Message,
  api?: BotContext["api"],
): BotContext => {
  const originalMessage = sourceMessage ?? ctx.msg;
  const commandMessage = originalMessage
    ? {
      ...originalMessage,
      text: `/${command}${input ? ` ${input}` : ""}`,
    } as Message
    : undefined;
  const sourceUpdate = commandMessage
    ? { ...ctx.update, message: commandMessage }
    : ctx.update;

  return new Proxy(ctx, {
    get(target, property, receiver) {
      if (property === "match") return input;
      // Context's own reply helpers read `this.api`, and `this` is this proxy,
      // so overriding it here is enough to observe everything the command
      // posts without the command knowing it is being watched.
      if (api && property === "api") return api;
      if (commandMessage && (property === "msg" || property === "message")) {
        return commandMessage;
      }
      if (property === "update") return sourceUpdate;
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property === "match") return true;
      return Reflect.set(target, property, value, receiver);
    },
  });
};

export interface ExecuteSkillCommandOptions {
  /** Message the command should behave as if it were replying to. */
  sourceMessage?: Message;
  /** API the command posts through, e.g. one that records the media it sends. */
  api?: BotContext["api"];
}

export const executeSkillCommand = async (
  skillName: string,
  command: SkillCommand,
  ctx: BotContext,
  input: string,
  options: ExecuteSkillCommandOptions = {},
): Promise<void> => {
  const commandContext = createCommandContext(
    ctx,
    command.command,
    input,
    options.sourceMessage,
    options.api,
  );
  const commandMiddlewares =
    (command.middlewares ?? []) as unknown as MiddlewareFn<BotContext>[];
  const composer = new Composer<BotContext>(
    ...commandMiddlewares,
    createInstrumentedCommandHandler(skillName, command),
  );
  await composer.middleware()(commandContext, () => Promise.resolve());
};
