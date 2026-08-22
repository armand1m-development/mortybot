import { getLogger } from "@std/log";
import { resolve } from "@std/path/posix";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import type { McpConfig, McpServerConfig } from "./types.ts";

const logger = () => getLogger();

const isStringRecord = (value: unknown): value is Record<string, string> =>
  typeof value === "object" && value !== null &&
  Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === "string",
  );

const optionalNonNegativeInteger = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;

const optionalPositiveInteger = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;

const normalizeServer = (
  name: string,
  raw: Record<string, unknown>,
): McpServerConfig => {
  const transport: McpServerConfig["transport"] = raw.transport === "http"
    ? "http"
    : "stdio";

  return {
    name,
    transport,
    command: typeof raw.command === "string" ? raw.command : undefined,
    args: Array.isArray(raw.args) ? raw.args.map(String) : undefined,
    env: isStringRecord(raw.env) ? raw.env : undefined,
    url: typeof raw.url === "string" ? raw.url : undefined,
    headers: isStringRecord(raw.headers) ? raw.headers : undefined,
    connectTimeoutMs: optionalPositiveInteger(raw.connectTimeoutMs),
    maxConnectAttempts: optionalPositiveInteger(raw.maxConnectAttempts),
    retryDelayMs: optionalNonNegativeInteger(raw.retryDelayMs),
    required: typeof raw.required === "boolean" ? raw.required : true,
  };
};

export const normalizeMcpConfig = (parsed: unknown): McpConfig => {
  const empty: McpConfig = { mcpServers: {} };
  if (typeof parsed !== "object" || parsed === null) {
    return empty;
  }

  const record = parsed as Record<string, unknown>;
  const serversRaw = typeof record.mcpServers === "object" &&
      record.mcpServers !== null
    ? record.mcpServers as Record<string, unknown>
    : record;

  const mcpServers: Record<string, McpServerConfig> = {};
  for (const [name, value] of Object.entries(serversRaw)) {
    if (typeof value !== "object" || value === null) {
      continue;
    }
    mcpServers[name] = normalizeServer(name, value as Record<string, unknown>);
  }

  return { mcpServers };
};

export const loadMcpConfig = async (
  configuration: Configuration,
): Promise<McpConfig> => {
  const empty: McpConfig = { mcpServers: {} };

  const rawPath = configuration.mcpConfigPath;
  if (!rawPath || rawPath.trim() === "") {
    return empty;
  }

  const filePath = resolve(Deno.cwd(), rawPath);

  let text: string;
  try {
    text = await Deno.readTextFile(filePath);
  } catch {
    logger().warn(
      `MCP config not found at "${filePath}". No MCP tools will be available.`,
    );
    return empty;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    logger().error(`Failed to parse MCP config at "${filePath}".`);
    logger().error(error);
    return empty;
  }

  return normalizeMcpConfig(parsed);
};
