export interface McpServerConfig {
  name: string;
  transport: "stdio" | "http";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  connectTimeoutMs?: number;
  maxConnectAttempts?: number;
  retryDelayMs?: number;
  required?: boolean;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export type McpServerState =
  | "connecting"
  | "ready"
  | "failed"
  | "closed";

export interface McpServerStatus {
  name: string;
  transport: McpServerConfig["transport"];
  required: boolean;
  state: McpServerState;
  attempts: number;
  tools: string[];
  error?: string;
}

export interface McpHealth {
  state: "disabled" | "ready" | "degraded" | "failed" | "closed";
  toolCount: number;
  tools: string[];
  servers: McpServerStatus[];
}
