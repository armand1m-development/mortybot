import { assert, assertEquals, assertThrows } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { skills } from "/src/skills/skills.ts";
import { loadSkillModule } from "./loadSkill.ts";
import { textAssistantTool } from "./assistantTool.ts";
import { SkillCommandToolRegistry } from "./SkillCommandToolRegistry.ts";
import type { SkillModule } from "./types/SkillModule.ts";

Deno.test("SkillCommandToolRegistry exposes every canonical command exactly once", async () => {
  const modules = await Promise.all(skills.map(loadSkillModule));
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills(modules);

  const tools = registry.getOpenAiTools();
  const expectedCommands = modules.flatMap((skill) => skill.commands);
  assertEquals(tools.length, expectedCommands.length);
  assertEquals(
    new Set(tools.map((tool) => tool.function.name)).size,
    tools.length,
  );

  for (const command of expectedCommands) {
    assert(
      tools.some((tool) => tool.function.name === `bot_${command.command}`),
    );
    for (const alias of command.aliases) {
      assert(!tools.some((tool) => tool.function.name === `bot_${alias}`));
    }
  }

  assert(
    !registry.getOpenAiTools("private").some((tool) =>
      tool.function.name === "bot_set_title"
    ),
  );
  assert(
    registry.getOpenAiTools("supergroup").some((tool) =>
      tool.function.name === "bot_set_title"
    ),
  );
});

Deno.test("SkillCommandToolRegistry runs command middleware with scoped match", async () => {
  const order: string[] = [];
  const skill: SkillModule = {
    name: "test",
    description: "Test skill",
    commands: [{
      command: "echo",
      aliases: ["say"],
      description: "Echo input",
      assistantTool: textAssistantTool("text"),
      middlewares: [async (ctx, next) => {
        order.push(`middleware:${ctx.match}`);
        await next();
      }],
      handler: (ctx) => {
        order.push(`handler:${ctx.match}`);
        return Promise.resolve();
      },
    }],
    initializers: [],
    middlewares: [],
    sessionDataInitializers: [],
    listeners: [],
    inlineQueryListeners: [],
    migrations: {},
    router: null,
  };
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([skill]);
  const ctx = {
    match: "original",
    update: { update_id: 1 },
  } as unknown as BotContext;

  const call = registry.prepare("bot_echo", { text: "hello" }, "private");
  const result = await registry.execute(ctx, call);

  assertEquals(order, ["middleware:hello", "handler:hello"]);
  assertEquals(ctx.match, "original");
  assertEquals(result.deliveredToChat, true);
});

Deno.test("SkillCommandToolRegistry validates typed command arguments", async () => {
  const modules = await Promise.all(skills.map(loadSkillModule));
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills(modules);

  assertEquals(
    registry.prepare("bot_convert", {
      amount: 25,
      fromCurrency: "usd",
      toCurrency: "brl",
    }).input,
    "25 USD to BRL",
  );
  assertEquals(
    registry.prepare("bot_join_hashtag", { hashtags: ["games", "#music"] })
      .input,
    "#games #music",
  );
  assert(
    registry.prepare("bot_get_income_report", {
      income: 36_000,
      socialSecurity: false,
    }).input.includes("socialSecurity=false"),
  );
  assertThrows(
    () => registry.prepare("bot_convert", { amount: 10 }),
    TypeError,
  );
});

Deno.test("bot_tp_now tool sends the native media group", async () => {
  const skill = await loadSkillModule("espiritosanto");
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([skill]);
  let mediaCount = 0;
  let deletedLoadingMessage = false;
  const message = {
    message_id: 7,
    date: 0,
    chat: { id: 123, type: "private" },
    from: { id: 42, is_bot: false, first_name: "Rick" },
    text: "show me the bridge",
  };
  const ctx = {
    update: { update_id: 1, message },
    msg: message,
    message,
    chat: message.chat,
    from: message.from,
    api: {
      sendChatAction: () => Promise.resolve(true),
      deleteMessage: () => {
        deletedLoadingMessage = true;
        return Promise.resolve(true);
      },
    },
    rodosolApi: {
      fetchThirdBridgeImages: () =>
        Promise.resolve([
          { bytes: new Uint8Array([1]), extension: "jpg" },
          { bytes: new Uint8Array([2]), extension: "jpg" },
        ]),
    },
    t: () => "Loading",
    reply: () => Promise.resolve({ message_id: 99 }),
    replyWithMediaGroup: (media: unknown[]) => {
      mediaCount = media.length;
      return Promise.resolve([]);
    },
  } as unknown as BotContext;

  const call = registry.prepare("bot_tp_now", {}, "private");
  await registry.execute(ctx, call);

  assertEquals(mediaCount, 2);
  assertEquals(deletedLoadingMessage, true);
});

Deno.test("a tool that posts pictures reports what they showed", async () => {
  const skill: SkillModule = {
    name: "test",
    description: "Test skill",
    commands: [{
      command: "cameras",
      aliases: [],
      description: "Post camera pictures",
      assistantTool: textAssistantTool("text"),
      handler: function (ctx) {
        return ctx.replyWithMediaGroup([]);
      },
    }],
    initializers: [],
    middlewares: [],
    sessionDataInitializers: [],
    listeners: [],
    inlineQueryListeners: [],
    migrations: {},
    router: null,
  };
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([skill]);

  let observed: number[] = [];
  const ctx = {
    update: { update_id: 1 },
    api: {
      // Context's reply helpers post through `this.api`, which is what the
      // collector wraps.
      sendMediaGroup: () =>
        Promise.resolve([{ message_id: 11 }, { message_id: 12 }]),
    },
    replyWithMediaGroup(media: unknown[]) {
      return (this as unknown as BotContext).api.sendMediaGroup(
        1,
        media as never,
      );
    },
  } as unknown as BotContext;

  const call = registry.prepare("bot_cameras", { text: "now" }, "private");
  const result = await registry.execute(ctx, call, {
    onMediaSent: (messages, command) => {
      observed = messages.map((message) => message.message_id);
      return Promise.resolve(
        `[2 photos that /${command} posted here: traffic]`,
      );
    },
  });

  assertEquals(observed, [11, 12]);
  assertEquals(result.mediaNotes, [
    "[2 photos that /cameras posted here: traffic]",
  ]);
  assert(result.text.includes("[2 photos that /cameras posted here: traffic]"));
});

Deno.test("commands that post nothing visual leave no media note", async () => {
  const skill: SkillModule = {
    name: "test",
    description: "Test skill",
    commands: [{
      command: "quiet",
      aliases: [],
      description: "Reply with text",
      assistantTool: textAssistantTool("text"),
      handler: () => Promise.resolve(),
    }],
    initializers: [],
    middlewares: [],
    sessionDataInitializers: [],
    listeners: [],
    inlineQueryListeners: [],
    migrations: {},
    router: null,
  };
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([skill]);
  let asked = false;
  const ctx = { update: { update_id: 1 }, api: {} } as unknown as BotContext;

  const call = registry.prepare("bot_quiet", { text: "hi" }, "private");
  const result = await registry.execute(ctx, call, {
    onMediaSent: () => {
      asked = true;
      return Promise.resolve("note");
    },
  });

  assertEquals(asked, false);
  assertEquals(result.mediaNotes, undefined);
});
