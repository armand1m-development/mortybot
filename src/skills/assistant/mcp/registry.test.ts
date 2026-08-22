import { assertEquals, assertRejects } from "@std/assert";
import type { Client } from "@modelcontextprotocol/sdk/client";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { McpRegistry } from "./registry.ts";

const unusedTransport = {} as Transport;

const searchTool = {
  name: "search_web",
  description: "Searches the web.",
  inputSchema: {
    type: "object" as const,
    properties: { query: { type: "string" } },
    required: ["query"],
  },
};

Deno.test("McpRegistry registers, calls, and reports a tool", async () => {
  let connectTimeout: number | undefined;
  let callTimeout: number | undefined;
  let receivedArguments: Record<string, unknown> | undefined;

  const client = {
    connect: (_transport: Transport, options?: { timeout?: number }) => {
      connectTimeout = options?.timeout;
      return Promise.resolve();
    },
    listTools: () => Promise.resolve({ tools: [searchTool] }),
    callTool: (
      params: { arguments?: Record<string, unknown> },
      _schema: unknown,
      options?: { timeout?: number },
    ) => {
      receivedArguments = params.arguments;
      callTimeout = options?.timeout;
      return Promise.resolve({
        content: [
          { type: "text", text: "Search results:" },
          {
            type: "text",
            text: JSON.stringify([
              { url: "https://example.com", title: "Example" },
            ]),
          },
        ],
      });
    },
    close: () => Promise.resolve(),
  } as unknown as Client;

  const registry = new McpRegistry({
    createClient: () => client,
    createTransport: () => unusedTransport,
  });

  await registry.registerServer({
    name: "search",
    transport: "stdio",
    command: "unused",
    connectTimeoutMs: 321,
    maxConnectAttempts: 1,
  });

  assertEquals(connectTimeout, 321);
  assertEquals(registry.getOpenAiTools(), [{
    type: "function",
    function: {
      name: "search_web",
      description: "Searches the web.",
      parameters: searchTool.inputSchema,
    },
  }]);
  assertEquals(registry.getHealth(), {
    state: "ready",
    toolCount: 1,
    tools: ["search_web"],
    servers: [{
      name: "search",
      transport: "stdio",
      required: true,
      state: "ready",
      attempts: 1,
      tools: ["search_web"],
    }],
  });

  assertEquals(await registry.callTool("search_web", { query: "Morty" }), {
    text: 'Search results:\n[{"url":"https://example.com","title":"Example"}]',
    sources: [{ url: "https://example.com", title: "Example" }],
  });
  assertEquals(receivedArguments, { query: "Morty" });
  assertEquals(callTimeout, 321);

  await registry.close();
  assertEquals(registry.getHealth().state, "closed");
});

Deno.test("McpRegistry retries a failed MCP connection", async () => {
  let attempts = 0;

  const registry = new McpRegistry({
    createClient: () => ({
      connect: () => {
        attempts += 1;
        if (attempts < 3) {
          return Promise.reject(new Error("not ready"));
        }
        return Promise.resolve();
      },
      listTools: () => Promise.resolve({ tools: [searchTool] }),
      close: () => Promise.resolve(),
    } as unknown as Client),
    createTransport: () => unusedTransport,
    sleep: () => Promise.resolve(),
  });

  await registry.registerServer({
    name: "search",
    transport: "stdio",
    maxConnectAttempts: 3,
    retryDelayMs: 0,
  });

  assertEquals(attempts, 3);
  assertEquals(registry.getHealth().servers[0].attempts, 3);
  await registry.close();
});

Deno.test("McpRegistry rejects a required server that never connects", async () => {
  const registry = new McpRegistry({
    createClient: () => ({
      connect: () => Promise.reject(new Error("unavailable")),
      close: () => Promise.resolve(),
    } as unknown as Client),
    createTransport: () => unusedTransport,
    sleep: () => Promise.resolve(),
  });

  await assertRejects(
    () =>
      registry.registerServer({
        name: "required-search",
        transport: "stdio",
        maxConnectAttempts: 2,
        retryDelayMs: 0,
      }),
    Error,
    "failed after 2 attempt(s)",
  );

  assertEquals(registry.getHealth().state, "failed");
  assertEquals(registry.getHealth().servers[0].attempts, 2);
});
