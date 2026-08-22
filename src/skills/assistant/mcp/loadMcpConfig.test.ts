import { assertEquals } from "@std/assert";
import { normalizeMcpConfig } from "./loadMcpConfig.ts";

Deno.test("normalizeMcpConfig applies MCP reliability settings", () => {
  const config = normalizeMcpConfig({
    mcpServers: {
      search: {
        command: "deno",
        args: ["run", "searxng-mcp"],
        connectTimeoutMs: 12_000,
        maxConnectAttempts: 4,
        retryDelayMs: 0,
        required: false,
      },
    },
  });

  assertEquals(config.mcpServers.search, {
    name: "search",
    transport: "stdio",
    command: "deno",
    args: ["run", "searxng-mcp"],
    env: undefined,
    url: undefined,
    headers: undefined,
    connectTimeoutMs: 12_000,
    maxConnectAttempts: 4,
    retryDelayMs: 0,
    required: false,
  });
});

Deno.test("normalizeMcpConfig defaults servers to required", () => {
  const config = normalizeMcpConfig({
    search: { transport: "http", url: "http://localhost:3000/mcp" },
  });

  assertEquals(config.mcpServers.search.required, true);
});
