import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import type {
  MemeTemplateEntry,
  MemeTemplateParam,
} from "../sessionData/types.ts";
import { cmdListMemeTemplates } from "./cmdListMemeTemplates.ts";

const slot = (
  name: string,
  optional = false,
): MemeTemplateParam => ({
  name,
  y: 0,
  x: 0,
  width: 100,
  height: 50,
  fontParams: {
    fontSize: 42,
    fontFamily: "Impact",
    color: "#ffffff",
    centralize: true,
    ...(optional ? { optional: true } : {}),
  },
});

const template = (
  fields: Partial<MemeTemplateEntry>,
): MemeTemplateEntry => ({
  name: "drake",
  url: "https://example.com/drake.jpg",
  params: [slot("top"), slot("bottom")],
  ...fields,
});

const createContext = (templates: MemeTemplateEntry[]) => {
  const replies: string[] = [];
  const ctx = {
    session: {
      memeTemplates: new Map(templates.map((t) => [t.name, t])),
    },
    t: (key: string) => key,
    reply: (text: string) => {
      replies.push(text);
      return Promise.resolve({ message_id: replies.length });
    },
  } as unknown as BotContext;
  return { ctx, replies };
};

const command = cmdListMemeTemplates as unknown as (
  ctx: BotContext,
) => Promise<unknown>;

Deno.test("listing meme templates names every slot and marks optional ones", async () => {
  const { ctx, replies } = createContext([
    template({ name: "drake" }),
    template({
      name: "gigachad",
      params: [slot("caption", true)],
    }),
  ]);

  await command(ctx);

  assertEquals(replies, [
    "- drake (slots: top, bottom)\n- gigachad (slots: caption?)",
  ]);
});

Deno.test("listing meme templates without any says so", async () => {
  const { ctx, replies } = createContext([]);

  await command(ctx);

  assertEquals(replies, ["image.noTemplates"]);
});
