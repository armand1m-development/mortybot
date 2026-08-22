import { getLogger } from "@std/log";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import { getSafeErrorSummary } from "/src/utilities/sanitizeLogText.ts";
import type { OpenAiTool, ToolCallResult } from "../httpClients/types.ts";
import { extractSources } from "../utilities/extractSources.ts";
import { loadMcpConfig } from "./loadMcpConfig.ts";
import type { McpHealth, McpServerConfig, McpServerStatus } from "./types.ts";
import { normalizeOpenAiTools } from "../utilities/normalizeTools.ts";

const logger = () => getLogger();

const INVALID_TOOL_NAME_CHARS = /[^a-zA-Z0-9_-]/g;
const DEFAULT_CONNECT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_CONNECT_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1_000;
/**
 * Tool output lands in the middle of an active conversation, which is the
 * costliest place a token can sit: everything after it has to be prefilled
 * again on the next turn. 8k characters is roughly 2k tokens, comfortably above
 * what a search actually returns, so this is a ceiling rather than a trim.
 */
const MAX_TOOL_RESULT_LENGTH = 8_000;

const sanitizeToolName = (name: string): string => {
  const sanitized = name.replace(INVALID_TOOL_NAME_CHARS, "_").slice(0, 64);
  return sanitized || "tool";
};

interface RegisteredTool {
  client: Client;
  originalName: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  timeoutMs: number;
}

export interface McpRegistryOptions {
  createClient?: () => Client;
  createTransport?: (config: McpServerConfig) => Transport;
  sleep?: (milliseconds: number) => Promise<void>;
}

const createTransport = (config: McpServerConfig): Transport =>
  config.transport === "http"
    ? new StreamableHTTPClientTransport(
      new URL(config.url ?? ""),
      config.headers ? { requestInit: { headers: config.headers } } : undefined,
    )
    : new StdioClientTransport({
      command: config.command ?? "",
      args: config.args ?? [],
      env: { ...Deno.env.toObject(), ...config.env },
    });

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const truncateToolResult = (text: string): string => {
  if (text.length <= MAX_TOOL_RESULT_LENGTH) {
    return text;
  }

  return `${text.slice(0, MAX_TOOL_RESULT_LENGTH)}\n\n[Tool output truncated]`;
};

export class McpRegistry {
  private readonly tools = new Map<string, RegisteredTool>();
  /** Memoized result of `getOpenAiTools`, invalidated whenever `tools` changes. */
  private openAiTools: OpenAiTool[] | undefined;
  private readonly statuses = new Map<string, McpServerStatus>();
  private clients: Client[] = [];
  private readonly createClient: () => Client;
  private readonly createTransport: (config: McpServerConfig) => Transport;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(options: McpRegistryOptions = {}) {
    this.createClient = options.createClient ??
      (() => new Client({ name: "mortybot", version: "1.0.0" }));
    this.createTransport = options.createTransport ?? createTransport;
    this.sleep = options.sleep ?? sleep;
  }

  async registerServer(config: McpServerConfig): Promise<void> {
    const required = config.required ?? true;
    const timeoutMs = config.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
    const maxAttempts = config.maxConnectAttempts ??
      DEFAULT_MAX_CONNECT_ATTEMPTS;
    const retryDelayMs = config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    const status: McpServerStatus = {
      name: config.name,
      transport: config.transport,
      required,
      state: "connecting",
      attempts: 0,
      tools: [],
    };
    this.statuses.set(config.name, status);

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      status.state = "connecting";
      status.attempts = attempt;
      delete status.error;

      const client = this.createClient();
      try {
        const transport = this.createTransport(config);
        await client.connect(transport, { timeout: timeoutMs });
        const { tools } = await client.listTools(undefined, {
          timeout: timeoutMs,
        });

        if (required && tools.length === 0) {
          throw new Error("The required MCP server returned no tools.");
        }

        const registeredNames: string[] = [];
        for (const tool of tools) {
          const openAiName = this.allocateName(sanitizeToolName(tool.name));
          registeredNames.push(openAiName);
          this.openAiTools = undefined;
          this.tools.set(openAiName, {
            client,
            originalName: tool.name,
            description: tool.description,
            inputSchema: (tool.inputSchema as Record<string, unknown>) ?? {
              type: "object",
              properties: {},
            },
            timeoutMs,
          });
        }

        this.clients.push(client);
        status.state = "ready";
        status.tools = registeredNames;

        logger().info(
          `MCP server "${config.name}" registered tools: ${
            registeredNames.join(", ") || "none"
          }.`,
        );
        return;
      } catch (error) {
        lastError = error;
        status.error = getSafeErrorSummary(error);
        await client.close().catch(() => {});

        if (attempt < maxAttempts) {
          logger().warn(
            `MCP server "${config.name}" failed to initialize ` +
              `(attempt ${attempt}/${maxAttempts}): ${status.error}`,
          );
          await this.sleep(retryDelayMs);
        }
      }
    }

    status.state = "failed";
    const message =
      `MCP server "${config.name}" failed after ${maxAttempts} attempt(s): ` +
      `${status.error ?? "unknown error"}`;
    logger().error(message);

    if (required) {
      throw new Error(message, { cause: lastError });
    }
  }

  private allocateName(base: string): string {
    let name = base;
    let suffix = 2;
    while (this.tools.has(name)) {
      name = `${base}_${suffix}`;
      suffix += 1;
    }
    return name;
  }

  /**
   * Returns the same array instance until the tool map changes, so callers can
   * memoize their own derived tool lists with a reference check.
   */
  getOpenAiTools(): OpenAiTool[] {
    // Normalized because this map is populated by concurrent MCP handshakes,
    // so its iteration order is not stable between restarts.
    return this.openAiTools ??= normalizeOpenAiTools(
      [...this.tools.entries()].map(([name, tool]) => ({
        type: "function",
        function: {
          name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      })),
    );
  }

  getHealth(): McpHealth {
    const servers = [...this.statuses.values()].map((status) => ({
      ...status,
      tools: [...status.tools],
    }));
    const tools = [...this.tools.keys()];

    let state: McpHealth["state"];
    if (servers.length === 0) {
      state = "disabled";
    } else if (servers.every((server) => server.state === "closed")) {
      state = "closed";
    } else if (servers.every((server) => server.state === "ready")) {
      state = "ready";
    } else if (
      servers.some((server) => server.state === "failed" && server.required)
    ) {
      state = "failed";
    } else {
      state = "degraded";
    }

    return {
      state,
      toolCount: tools.length,
      tools,
      servers,
    };
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { text: `Unknown tool "${name}".`, sources: [] };
    }

    try {
      const result = await tool.client.callTool(
        {
          name: tool.originalName,
          arguments: args,
        },
        undefined,
        { timeout: tool.timeoutMs },
      ) as {
        content?: Array<{ type: string; text?: string }>;
        structuredContent?: unknown;
      };

      const blocks = result.content ?? [];
      const text = truncateToolResult(
        blocks
          .map((block) =>
            block.type === "text" ? (block.text ?? "") : JSON.stringify(block)
          )
          .join("\n"),
      );

      const sources = extractSources(result.structuredContent ?? text);
      return { text, sources };
    } catch (error) {
      logger().error(`MCP tool "${tool.originalName}" failed.`);
      logger().error(error);
      return {
        text: `The tool "${tool.originalName}" failed to run.`,
        sources: [],
      };
    }
  }

  async close(): Promise<void> {
    await Promise.all(
      this.clients.map((client) => client.close().catch(() => {})),
    );
    this.clients = [];
    this.openAiTools = undefined;
    this.tools.clear();
    for (const status of this.statuses.values()) {
      status.state = "closed";
      status.tools = [];
    }
  }
}

let instance: McpRegistry | null = null;
const emptyRegistry = new McpRegistry();
let initialization: Promise<McpRegistry> | null = null;

export const initMcpRegistry = async (
  configuration: Configuration,
): Promise<McpRegistry> => {
  if (instance?.getHealth().state === "ready") {
    return instance;
  }

  if (initialization) {
    return initialization;
  }

  const registry = new McpRegistry();
  instance = registry;
  initialization = (async () => {
    const config = await loadMcpConfig(configuration);
    for (const serverConfig of Object.values(config.mcpServers)) {
      await registry.registerServer(serverConfig);
    }

    return registry;
  })();

  try {
    return await initialization;
  } finally {
    initialization = null;
  }
};

export const getMcpRegistry = (): McpRegistry => instance ?? emptyRegistry;
