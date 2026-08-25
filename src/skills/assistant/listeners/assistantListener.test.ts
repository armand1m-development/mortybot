import {
  assertEquals,
  assertNotStrictEquals,
  assertRejects,
  assertStrictEquals,
  assertStringIncludes,
} from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { skills } from "/src/skills/skills.ts";
import { loadSkillModule } from "/src/platform/skillModules/loadSkill.ts";
import { SkillCommandToolRegistry } from "/src/platform/skillModules/SkillCommandToolRegistry.ts";
import {
  assistantListener,
  buildFabricationRetryMessages,
  buildSystemPrompt,
  MAX_CACHED_SYSTEM_PROMPTS,
} from "./assistantListener.ts";

/**
 * The memo cache is module state shared by every test in this file, so each
 * test uses directives no other test touches. Cache identity is observable by
 * comparing the Promises before awaiting them: a hit returns the same Promise,
 * a miss a fresh one.
 */
const directive = (index: number): string =>
  index === 0
    ? ""
    : `## Standing preferences\n\nChat-wide:\n- [p${index}] Rule ${index}.`;

type PromptInputs = Parameters<typeof buildSystemPrompt>;

const inputs = (
  preferencesDirective: string,
): PromptInputs => ["en", false, "auto", true, false, preferencesDirective];

Deno.test("identical inputs return the memoized prompt", async () => {
  const first = buildSystemPrompt(...inputs(directive(9001)));
  const second = buildSystemPrompt(...inputs(directive(9001)));
  await first;
  await second;

  assertStrictEquals(first, second);
});

Deno.test("the preferences directive is rendered verbatim at the end", async () => {
  const prompt = await buildSystemPrompt(...inputs(directive(9002)));

  assertStringIncludes(prompt, directive(9002));
  assertEquals(prompt.endsWith(directive(9002)), true);
});

Deno.test("no preferences leave the prompt without a preferences section", async () => {
  const prompt = await buildSystemPrompt(...inputs(""));

  assertEquals(prompt.includes("## Standing preferences"), false);
  // The language directive is the last remaining dynamic segment.
  assertEquals(prompt.endsWith("Respond in English."), true);
});

Deno.test("directives order language, then emoji, then preferences", async () => {
  const prompt = await buildSystemPrompt(
    ...(["en", false, "auto", false, false, directive(9003)] as PromptInputs),
  );

  const languageAt = prompt.indexOf("Respond in English.");
  const emojiAt = prompt.indexOf("Do not use emojis anywhere");
  const preferencesAt = prompt.indexOf(directive(9003));

  assertEquals(languageAt >= 0 && emojiAt > languageAt, true);
  assertEquals(preferencesAt > emojiAt, true);
});

Deno.test("tool instructions document the history tool trace marker", async () => {
  const withTools = await buildSystemPrompt(
    ...(["en", true, "auto", true, false, ""] as PromptInputs),
  );

  assertStringIncludes(withTools, "### Tool results in conversation history");
  assertStringIncludes(withTools, "`[tools called this turn:");

  const withoutTools = await buildSystemPrompt(...inputs(""));
  assertEquals(
    withoutTools.includes("### Tool results in conversation history"),
    false,
  );
});

Deno.test("the prompt cache evicts its least recently used entries", async () => {
  const warm = buildSystemPrompt(...inputs(directive(9100)));
  await warm;

  // Push a full cache worth of distinct prompts through, so everything that
  // existed before — including the warm entry — becomes eviction fodder.
  for (let index = 0; index < MAX_CACHED_SYSTEM_PROMPTS; index += 1) {
    await buildSystemPrompt(...inputs(directive(9200 + index)));
  }

  const latest = directive(9200 + MAX_CACHED_SYSTEM_PROMPTS - 1);

  const reloadedWarm = buildSystemPrompt(...inputs(directive(9100)));
  const stillCachedLatest = buildSystemPrompt(...inputs(latest));
  const stillCachedLatestAgain = buildSystemPrompt(...inputs(latest));
  await Promise.all([reloadedWarm, stillCachedLatest, stillCachedLatestAgain]);

  assertNotStrictEquals(reloadedWarm, warm);
  assertStrictEquals(stillCachedLatest, stillCachedLatestAgain);
});

const runAssistantListener = assistantListener as unknown as (
  ctx: BotContext,
) => Promise<{ handled: boolean } | undefined>;

const NO_TURN_ERROR = "assistant turn must not start";

const buildContext = ({
  chatType,
  message,
  replyToBotMessage = false,
}: {
  chatType: "private" | "supergroup";
  message: Record<string, unknown>;
  replyToBotMessage?: boolean;
}) => {
  const chat = { id: 4242, type: chatType };
  const me = { id: 999, username: "MortyBot", is_bot: true };
  let replyCalls = 0;

  const ctx = {
    chat,
    me,
    update: { update_id: 1 },
    msg: {
      message_id: 7,
      date: 0,
      chat,
      from: { id: 42, is_bot: false, first_name: "Rick" },
      ...(replyToBotMessage
        ? {
          reply_to_message: {
            message_id: 6,
            date: 0,
            chat,
            from: { id: me.id, is_bot: true, first_name: "Morty" },
          },
        }
        : {}),
      ...message,
    },
    configuration: {
      assistantAllowedChatIds: [4242],
      environment: "development" as const,
      assistantTrajectoryEnabled: false,
    },
    t: () => "Checking",
    reply: () => {
      replyCalls++;
      throw new Error(NO_TURN_ERROR);
    },
  } as unknown as BotContext;

  return { ctx, getReplyCalls: () => replyCalls };
};

const buildRegistry = async () => {
  const modules = await Promise.all(skills.map(loadSkillModule));
  const registry = new SkillCommandToolRegistry();
  registry.registerSkills(modules);
  return registry;
};

Deno.test("assistant steps aside for a leading command in a private chat", async () => {
  const { ctx, getReplyCalls } = buildContext({
    chatType: "private",
    message: {
      text: "/tp_now",
      entities: [{ type: "bot_command", offset: 0, length: 7 }],
    },
  });
  ctx.skillCommandTools = await buildRegistry();

  const result = await runAssistantListener(ctx);

  assertEquals(result, { handled: false });
  assertEquals(getReplyCalls(), 0);
});

Deno.test("assistant steps aside for a command reply in a group", async () => {
  const { ctx, getReplyCalls } = buildContext({
    chatType: "supergroup",
    replyToBotMessage: true,
    message: {
      text: "/tp_now",
      entities: [{ type: "bot_command", offset: 0, length: 7 }],
    },
  });
  ctx.skillCommandTools = await buildRegistry();

  const result = await runAssistantListener(ctx);

  assertEquals(result, { handled: false });
  assertEquals(getReplyCalls(), 0);
});

Deno.test("assistant keeps a command sent as a media caption", async () => {
  const { ctx } = buildContext({
    chatType: "private",
    message: {
      photo: [{ file_id: "photo-1", width: 640, height: 480 }],
      caption: "/tp_now",
      caption_entities: [{ type: "bot_command", offset: 0, length: 7 }],
    },
  });
  ctx.skillCommandTools = await buildRegistry();

  // The command chain never matches caption commands, so the caption must
  // become an assistant turn; the throwing reply marks how far intake got.
  await assertRejects(() => runAssistantListener(ctx), Error, NO_TURN_ERROR);
});

Deno.test("assistant keeps an unknown leading command", async () => {
  const { ctx } = buildContext({
    chatType: "private",
    message: {
      text: "/tp_naw",
      entities: [{ type: "bot_command", offset: 0, length: 7 }],
    },
  });
  ctx.skillCommandTools = await buildRegistry();

  await assertRejects(() => runAssistantListener(ctx), Error, NO_TURN_ERROR);
});

Deno.test("the fabrication retry asks without the poisoned history", () => {
  const system = { role: "system" as const, content: "system prompt" };
  const user = { role: "user" as const, content: "third bridge images pls" };
  const fabricated =
    "[tools called this turn: bot_tp_now]\nThe cameras are now posted.";

  const retry = buildFabricationRetryMessages(
    system,
    user,
    fabricated,
    [],
    true,
  );

  // System and the user's question, the forged reply, then the correction —
  // and nothing of the history the model fabricated under.
  assertEquals(retry.length, 4);
  assertEquals(retry[0], system);
  assertEquals(retry[1], user);
  assertEquals(retry[2], { role: "assistant", content: fabricated });
  assertEquals(retry[3].role, "user");
  assertStringIncludes(retry[3].content as string, "set aside");
  assertStringIncludes(retry[3].content as string, "forged");
  // The phantom-reply rule: the user never saw the rejected attempt.
  assertStringIncludes(retry[3].content as string, "never saw");
});
