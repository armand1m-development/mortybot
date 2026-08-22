import { assertEquals, assertRejects } from "@std/assert";
import { chatCompletion } from "./chatCompletion.ts";

const baseParams = {
  token: "test-token",
  baseUrl: "http://assistant.test/v1/",
  model: "test-model",
  messages: [{ role: "user" as const, content: "Build something" }],
};

const createChunkedResponse = (
  chunks: Uint8Array[],
  contentType: string,
): Response =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    }),
    { headers: { "content-type": contentType } },
  );

Deno.test("chatCompletion requests and reconstructs streamed text", async () => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode([
    'data: {"choices":[{"delta":{"role":"assistant","content":"Olá "}}]}',
    "",
    'data: {"choices":[{"delta":{"content":"♟"}}]}',
    "",
    "data: [DONE]",
    "",
  ].join("\r\n"));
  const chunks = [
    encoded.slice(0, 19),
    encoded.slice(19, encoded.length - 2),
    encoded.slice(encoded.length - 2),
  ];
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const fetcher: typeof fetch = (input, init) => {
    requestUrl = input.toString();
    requestInit = init;
    return Promise.resolve(createChunkedResponse(chunks, "text/event-stream"));
  };

  const result = await chatCompletion({ ...baseParams, fetcher });

  assertEquals(requestUrl, "http://assistant.test/v1/chat/completions");
  assertEquals(requestInit?.method, "POST");
  assertEquals(
    JSON.parse(requestInit?.body as string),
    {
      model: "test-model",
      messages: baseParams.messages,
      stream: true,
      stream_options: { include_usage: true },
    },
  );
  assertEquals(result.message, { role: "assistant", content: "Olá ♟" });
});

Deno.test("chatCompletion reconstructs fragmented streamed tool calls", async () => {
  const body = [
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call-","type":"function","function":{"name":"search_","arguments":"{\\"query\\":"}}]}}]}',
    "",
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"1","function":{"name":"web","arguments":"\\"Morty\\"}"}}]}}]}',
    "",
    "data: [DONE]",
    "",
  ].join("\n");
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      createChunkedResponse(
        [new TextEncoder().encode(body)],
        "text/event-stream; charset=utf-8",
      ),
    );

  const result = await chatCompletion({ ...baseParams, fetcher });

  assertEquals(result.message, {
    role: "assistant",
    content: "",
    tool_calls: [{
      id: "call-1",
      type: "function",
      function: { name: "search_web", arguments: '{"query":"Morty"}' },
    }],
  });
});

Deno.test("chatCompletion accepts a non-streaming JSON fallback", async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(Response.json({
      choices: [{ message: { role: "assistant", content: "Fallback" } }],
    }));

  const result = await chatCompletion({ ...baseParams, fetcher });

  assertEquals(result.message, { role: "assistant", content: "Fallback" });
});

Deno.test("chatCompletion keeps an active stream alive past the idle limit", async () => {
  const fetcher: typeof fetch = (_input, init) => {
    const encoder = new TextEncoder();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const events = [
      'data: {"choices":[{"delta":{"content":"Still "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"working"}}]}\n\n',
      "data: [DONE]\n\n",
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let index = 0;
        const push = () => {
          if (index === events.length) {
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(events[index++]));
          timer = setTimeout(push, 10);
        };
        push();
        init?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          controller.error(new DOMException("Aborted", "AbortError"));
        }, { once: true });
      },
      cancel() {
        clearTimeout(timer);
      },
    });
    return Promise.resolve(
      new Response(stream, {
        headers: { "content-type": "text/event-stream" },
      }),
    );
  };

  const result = await chatCompletion({
    ...baseParams,
    fetcher,
    idleTimeoutMs: 20,
    timeoutMs: 200,
  });

  assertEquals(result.message.content, "Still working");
});

Deno.test("chatCompletion aborts a stream that stops producing data", async () => {
  const fetcher: typeof fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    });

  await assertRejects(
    () =>
      chatCompletion({
        ...baseParams,
        fetcher,
        idleTimeoutMs: 10,
        timeoutMs: 200,
      }),
    Error,
    "Assistant response stalled.",
  );
});

Deno.test("chatCompletion caps a stream that remains active indefinitely", async () => {
  const fetcher: typeof fetch = (_input, init) => {
    const encoder = new TextEncoder();
    let timer: ReturnType<typeof setInterval> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
        timer = setInterval(
          () => controller.enqueue(encoder.encode(": keep-alive\n\n")),
          5,
        );
        init?.signal?.addEventListener("abort", () => {
          clearInterval(timer);
          controller.error(new DOMException("Aborted", "AbortError"));
        }, { once: true });
      },
      cancel() {
        clearInterval(timer);
      },
    });
    return Promise.resolve(
      new Response(stream, {
        headers: { "content-type": "text/event-stream" },
      }),
    );
  };

  await assertRejects(
    () =>
      chatCompletion({
        ...baseParams,
        fetcher,
        idleTimeoutMs: 20,
        timeoutMs: 35,
      }),
    Error,
    "Assistant request exceeded maximum duration.",
  );
});

Deno.test("chatCompletion reports usage and cached prompt tokens", async () => {
  const body = [
    'data: {"choices":[{"delta":{"content":"Hi"}}]}',
    "",
    'data: {"choices":[],"usage":{"prompt_tokens":7400,"completion_tokens":310,"prompt_tokens_details":{"cached_tokens":6808}}}',
    "",
    "data: [DONE]",
    "",
  ].join("\n");
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      createChunkedResponse(
        [new TextEncoder().encode(body)],
        "text/event-stream",
      ),
    );

  const result = await chatCompletion({ ...baseParams, fetcher });

  assertEquals(result.message.content, "Hi");
  assertEquals(result.usage, {
    promptTokens: 7400,
    completionTokens: 310,
    cachedPromptTokens: 6808,
  });
});

Deno.test("chatCompletion leaves cached tokens undefined without a cache report", async () => {
  const body = [
    'data: {"choices":[{"delta":{"content":"Hi"}}]}',
    "",
    'data: {"choices":[],"usage":{"prompt_tokens":120,"completion_tokens":8}}',
    "",
    "data: [DONE]",
    "",
  ].join("\n");
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      createChunkedResponse(
        [new TextEncoder().encode(body)],
        "text/event-stream",
      ),
    );

  const result = await chatCompletion({ ...baseParams, fetcher });

  assertEquals(result.usage, { promptTokens: 120, completionTokens: 8 });
  assertEquals(result.usage?.cachedPromptTokens, undefined);
});

Deno.test("chatCompletion reads usage from a non-streaming response", async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(Response.json({
      choices: [{ message: { role: "assistant", content: "Fallback" } }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 2,
        prompt_tokens_details: { cached_tokens: 4 },
      },
    }));

  const result = await chatCompletion({ ...baseParams, fetcher });

  assertEquals(result.usage, {
    promptTokens: 10,
    completionTokens: 2,
    cachedPromptTokens: 4,
  });
});

Deno.test("chatCompletion forwards sampling parameters when provided", async () => {
  let requestInit: RequestInit | undefined;
  const fetcher: typeof fetch = (_input, init) => {
    requestInit = init;
    return Promise.resolve(
      createChunkedResponse(
        [
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',
          ),
        ],
        "text/event-stream",
      ),
    );
  };

  await chatCompletion({
    ...baseParams,
    fetcher,
    temperature: 0.7,
    maxTokens: 2000,
  });

  const body = JSON.parse(requestInit?.body as string);
  assertEquals(body.temperature, 0.7);
  assertEquals(body.max_tokens, 2000);
});

Deno.test("chatCompletion delivers content fragments as they arrive", async () => {
  const encoder = new TextEncoder();
  const seen: string[] = [];
  const events = [
    'data: {"choices":[{"delta":{"content":"Mor"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"ty"}}]}\n\n',
    "data: [DONE]\n\n",
  ];
  // Each event is a separate stream chunk, and the assertion below runs after
  // the whole body was consumed, so seeing every fragment separately proves the
  // reader parsed as it read rather than buffering the body first.
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      createChunkedResponse(
        events.map((event) => encoder.encode(event)),
        "text/event-stream",
      ),
    );

  const result = await chatCompletion({
    ...baseParams,
    fetcher,
    stream: { onDelta: (text) => seen.push(text) },
  });

  assertEquals(seen, ["Mor", "ty"]);
  assertEquals(result.message.content, "Morty");
});

Deno.test("chatCompletion announces a tool call and stops emitting fragments", async () => {
  const encoder = new TextEncoder();
  const seen: string[] = [];
  let toolCalls = 0;
  const events = [
    'data: {"choices":[{"delta":{"content":"thinking"}}]}\n\n',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"c1","function":{"name":"search_web","arguments":"{}"}}]}}]}\n\n',
    'data: {"choices":[{"delta":{"content":" more"}}]}\n\n',
    "data: [DONE]\n\n",
  ];
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      createChunkedResponse(
        events.map((event) => encoder.encode(event)),
        "text/event-stream",
      ),
    );

  const result = await chatCompletion({
    ...baseParams,
    fetcher,
    stream: {
      onDelta: (text) => seen.push(text),
      onToolCall: () => toolCalls += 1,
    },
  });

  assertEquals(seen, ["thinking"]);
  assertEquals(toolCalls, 1);
  // Content that arrives after the tool call is still kept in the message; it
  // is only withheld from the progressive display.
  assertEquals(result.message.content, "thinking more");
  assertEquals(result.message.tool_calls?.[0].function.name, "search_web");
});
