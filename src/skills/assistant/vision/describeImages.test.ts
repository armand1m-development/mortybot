import { assert, assertEquals } from "@std/assert";
import { describeImages, stripThinking } from "./describeImages.ts";
import type { ChatCompletionParams } from "../httpClients/chatCompletion.ts";
import type { OpenAiContentPart } from "../httpClients/types.ts";
import type { VisionImage } from "./types.ts";

const image = (label: string): VisionImage => ({
  bytes: new Uint8Array([1, 2, 3]),
  mimeType: "image/jpeg",
  label,
});

const capture = () => {
  const calls: ChatCompletionParams[] = [];
  const completion = (params: ChatCompletionParams) => {
    calls.push(params);
    return Promise.resolve({
      message: { role: "assistant" as const, content: "A rain-soaked bridge." },
    });
  };
  return { calls, completion };
};

Deno.test("every image of a turn travels in one request", async () => {
  const { calls, completion } = capture();

  const description = await describeImages({
    token: "t",
    baseUrl: "http://localhost/v1",
    model: "qwen",
    images: [image("Photo 1"), image("Photo 2")],
    context: "the bot posted them",
    completion,
  });

  assertEquals(description, "A rain-soaked bridge.");
  assertEquals(calls.length, 1);

  const parts = calls[0].messages[1].content as OpenAiContentPart[];
  const images = parts.filter((part) => part.type === "image_url");
  assertEquals(images.length, 2);
  assert(
    images.every((part) =>
      part.type === "image_url" &&
      part.image_url.url.startsWith("data:image/jpeg;base64,")
    ),
  );
  assert(
    parts.some((part) =>
      part.type === "text" && part.text.includes("the bot posted them")
    ),
  );
  assert(
    parts.some((part) => part.type === "text" && part.text === "Photo 2:"),
  );
});

Deno.test("describing an image never spends time thinking", async () => {
  const { calls, completion } = capture();

  await describeImages({
    token: "t",
    baseUrl: "http://localhost/v1",
    model: "qwen",
    images: [image("Photo")],
    completion,
  });

  assertEquals(calls[0].chatTemplateKwargs, { enable_thinking: false });
});

Deno.test("no images means no request at all", async () => {
  const { calls, completion } = capture();

  assertEquals(
    await describeImages({
      token: "t",
      baseUrl: "http://localhost/v1",
      model: "qwen",
      images: [],
      completion,
    }),
    "",
  );
  assertEquals(calls.length, 0);
});

Deno.test("a leaked reasoning block is not part of the description", () => {
  assertEquals(
    stripThinking("<think>the user wants…</think>\n\nA bridge at dusk."),
    "A bridge at dusk.",
  );
  assertEquals(stripThinking("A bridge at dusk."), "A bridge at dusk.");
});
