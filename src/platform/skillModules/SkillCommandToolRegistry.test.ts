import { assert, assertEquals, assertThrows } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { skills } from "/src/skills/skills.ts";
import { loadSkillModule } from "./loadSkill.ts";
import { listingAssistantTool, textAssistantTool } from "./assistantTool.ts";
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

Deno.test("SkillCommandToolRegistry reports whether a command name is registered", async () => {
  const modules = await Promise.all(skills.map(loadSkillModule));
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills(modules);

  assertEquals(registry.isRegisteredCommand("tp_now", "private"), true);
  assertEquals(registry.isRegisteredCommand("assistant_lang", "private"), true);
  assertEquals(registry.isRegisteredCommand("set_title", "private"), false);
  assertEquals(registry.isRegisteredCommand("set_title", "supergroup"), true);
  assertEquals(registry.isRegisteredCommand("batiza", "supergroup"), true);
  assertEquals(registry.isRegisteredCommand("batiza", "private"), false);
  assertEquals(registry.isRegisteredCommand("tp_naw", "private"), false);
  // Command names compare verbatim, mirroring the command chain.
  assertEquals(registry.isRegisteredCommand("TP_NOW", "private"), false);
  // `has` stays about tool names, not command names.
  assertEquals(registry.has("tp_now"), false);
  assertEquals(registry.has("bot_tp_now"), true);
});

Deno.test("volatile camera commands carry the always-refetch directive", async () => {
  const modules = await Promise.all(skills.map(loadSkillModule));
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills(modules);
  const tools = registry.getOpenAiTools("private");
  const descriptionOf = (name: string): string =>
    tools.find((tool) => tool.function.name === name)?.function.description ??
      "";

  // Live feeds tell the model to fetch again instead of answering from an
  // earlier fetch's note in the history — and carry the Portuguese and
  // English phrasings users actually ask with.
  for (const name of ["bot_tp_now"]) {
    assert(descriptionOf(name).includes("Live snapshot"), name);
    assert(
      descriptionOf(name).includes("Call this tool on every request"),
      name,
    );
    assert(descriptionOf(name).includes("never ask permission"), name);
  }
  assert(descriptionOf("bot_tp_now").includes("terceira ponte"));

  // Static commands must not carry it.
  assert(!descriptionOf("bot_chat_id").includes("Live snapshot"));
});

Deno.test("bot_memes is an inspectable listing of this chat's templates", async () => {
  const modules = await Promise.all(skills.map(loadSkillModule));
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills(modules);

  const memes = registry.getOpenAiTools("private").find((tool) =>
    tool.function.name === "bot_memes"
  )!;
  const schema = memes.function.parameters as Record<string, unknown>;

  // The listing is answerable as data, so the model never has to enumerate
  // this chat's templates from memory.
  assertEquals(Object.keys(schema.properties as object), ["deliver_to_chat"]);
  assert(memes.function.description?.includes("only source"));
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
    api: {},
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
    thirdBridgeApi: {
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
  let observedDescription: string | undefined;
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
    onMediaSent: (messages, command, description) => {
      observed = messages.map((message) => message.message_id);
      observedDescription = description;
      return Promise.resolve(
        `[2 photos that /${command} posted here: traffic]`,
      );
    },
  });

  assertEquals(observed, [11, 12]);
  assertEquals(observedDescription, "Post camera pictures");
  assertEquals(result.mediaNotes, [
    "[2 photos that /cameras posted here: traffic]",
  ]);
  assert(result.text.includes("[2 photos that /cameras posted here: traffic]"));
  // With media described, the model is asked for an analysis, not just a
  // confirmation.
  assert(result.text.includes("briefly analyze the pictures"));
});

Deno.test("a failed fetch reaches the model as the command's own report", async () => {
  const skill: SkillModule = {
    name: "test",
    description: "Test skill",
    commands: [{
      command: "cameras",
      aliases: [],
      description: "Post camera pictures",
      assistantTool: textAssistantTool("text"),
      handler: (ctx) => ctx.reply("Could not fetch the camera images."),
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
  const posted: string[] = [];
  const ctx = listingContext(posted);

  const call = registry.prepare("bot_cameras", { text: "now" }, "private");
  const result = await registry.execute(ctx, call);

  // The error text itself travels back, so the model relays the failure
  // instead of confirming a delivery that never happened.
  assert(result.text.includes("Could not fetch the camera images."));
  assert(result.text.includes("relay that honestly"));
  assert(!result.text.includes("delivered its output or guidance"));
  assertEquals(posted, ["Could not fetch the camera images."]);
});

Deno.test("media that cannot be analyzed is reported as undescribed", async () => {
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([{
    ...listingSkill(),
    commands: [{
      ...listingSkill().commands[0],
      command: "cameras",
      handler: function (ctx: BotContext) {
        return ctx.replyWithMediaGroup([]);
      },
    }],
  }]);
  const ctx = {
    update: { update_id: 1 },
    api: {
      sendMediaGroup: () => Promise.resolve([{ message_id: 11 }]),
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
    onMediaSent: () => Promise.resolve(undefined),
  });

  assert(result.text.includes("could not be analyzed"));
  assert(result.text.includes("Never describe, guess, or invent"));
  assertEquals(result.mediaNotes, undefined);
});

Deno.test("a delivered listing longer than the cap is not serialized back", async () => {
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([{
    ...listingSkill(),
    commands: [{
      ...listingSkill().commands[0],
      handler: (ctx) => ctx.reply("- thing\n".repeat(200)),
    }],
  }]);
  const posted: string[] = [];
  const ctx = listingContext(posted);

  const call = registry.prepare("bot_things", {}, "private");
  const result = await registry.execute(ctx, call);

  assert(result.text.includes("brief confirmation"));
  assert(!result.text.includes("- thing"));
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

const listingSkill = (): SkillModule => ({
  name: "test",
  description: "Test skill",
  commands: [{
    command: "things",
    aliases: [],
    description: "List all things",
    assistantTool: listingAssistantTool(),
    handler: (ctx) => ctx.reply("- one\n- two"),
  }],
  initializers: [],
  middlewares: [],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
});

const listingContext = (posted: string[]) => ({
  update: { update_id: 1 },
  chat: { id: 1 },
  // Context's reply helpers post through `this.api`, mirroring grammy, so the
  // collector wrapping `api` is what intercepts them.
  reply(text: string) {
    return (this as unknown as BotContext).api.sendMessage(1, text as never);
  },
  api: {
    sendMessage: (_chatId: number, text: string) => {
      posted.push(text);
      return Promise.resolve({ message_id: 1 });
    },
  },
} as unknown as BotContext);

Deno.test("inspectable tools expose deliver_to_chat, others do not", () => {
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([listingSkill()]);

  const schema = registry.getOpenAiTools()[0].function
    .parameters as Record<string, Record<string, unknown>>;
  assertEquals(
    Object.keys(schema.properties),
    ["deliver_to_chat"],
  );

  const registryWithout = new SkillCommandToolRegistry();
  registryWithout.registerSkills([{
    ...listingSkill(),
    commands: [{
      ...listingSkill().commands[0],
      assistantTool: textAssistantTool("text"),
      handler: (ctx) => ctx.reply(ctx.match),
    }],
  }]);
  assertEquals(
    Object.keys(
      (registryWithout.getOpenAiTools()[0].function.parameters as Record<
        string,
        Record<string, unknown>
      >).properties,
    ),
    ["text"],
  );
});

Deno.test("prepare defaults deliver_to_chat to posting and validates it", () => {
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([listingSkill()]);

  assertEquals(registry.prepare("bot_things", {}).deliverToChat, true);
  assertEquals(
    registry.prepare("bot_things", { deliver_to_chat: false }).deliverToChat,
    false,
  );
  assertEquals(
    registry.prepare("bot_things", { deliver_to_chat: true }).deliverToChat,
    true,
  );
  assertThrows(
    () => registry.prepare("bot_things", { deliver_to_chat: "false" }),
    TypeError,
  );
});

Deno.test("data mode captures the listing instead of posting it", async () => {
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([listingSkill()]);
  const posted: string[] = [];
  const ctx = listingContext(posted);

  const call = registry.prepare("bot_things", { deliver_to_chat: false });
  const result = await registry.execute(ctx, call);

  assertEquals(posted, []);
  assertEquals(result.deliveredToChat, undefined);
  assert(result.text.includes("- one\n- two"));
  assert(result.text.includes("Nothing was posted to the chat"));
});

Deno.test("delivery mode still posts the listing natively", async () => {
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills([listingSkill()]);
  const posted: string[] = [];
  const ctx = listingContext(posted);

  const call = registry.prepare("bot_things", {});
  const result = await registry.execute(ctx, call);

  assertEquals(posted, ["- one\n- two"]);
  assertEquals(result.deliveredToChat, true);
});
