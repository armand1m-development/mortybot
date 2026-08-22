import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { getSafeErrorSummary } from "/src/utilities/sanitizeLogText.ts";

const SEARCH_TOOL_NAME = "search_web";
const DEFAULT_SEARCH_TIMEOUT_MS = 15_000;
const MAX_RESULTS = 8;

type Fetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface SearchResult {
  url: string;
  title: string;
  content: string;
  engines: string[];
}

interface SearchOptions {
  serverUrl: string;
  method: "get" | "post";
  query: string;
  page: number;
  fetch?: Fetch;
  timeoutMs?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const normalizeSearxngResults = (payload: unknown): SearchResult[] => {
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new Error("SearXNG returned an invalid JSON response.");
  }

  const results: SearchResult[] = [];
  const seen = new Set<string>();
  const add = (result: SearchResult) => {
    if (seen.has(result.url) || results.length >= MAX_RESULTS) {
      return;
    }
    seen.add(result.url);
    results.push(result);
  };

  for (const item of payload.results) {
    if (!isRecord(item)) {
      continue;
    }

    const url = typeof item.url === "string" ? item.url : undefined;
    const title = typeof item.title === "string" ? item.title : undefined;
    if (!url || !title) {
      continue;
    }

    const engines = Array.isArray(item.engines)
      ? item.engines.filter((engine): engine is string =>
        typeof engine === "string"
      )
      : typeof item.engine === "string"
      ? [item.engine]
      : [];

    add({
      url,
      title,
      content: typeof item.content === "string" ? item.content : "",
      engines,
    });

    if (results.length >= MAX_RESULTS) {
      break;
    }
  }

  if (results.length === 0 && Array.isArray(payload.answers)) {
    for (const answer of payload.answers) {
      if (!isRecord(answer) || typeof answer.url !== "string") {
        continue;
      }
      add({
        url: answer.url,
        title: typeof answer.title === "string" ? answer.title : "Answer",
        content: typeof answer.answer === "string" ? answer.answer : "",
        engines: typeof answer.engine === "string" ? [answer.engine] : [],
      });
    }
  }

  if (results.length === 0 && Array.isArray(payload.infoboxes)) {
    for (const infobox of payload.infoboxes) {
      if (!isRecord(infobox)) {
        continue;
      }
      const firstLink = Array.isArray(infobox.urls) &&
          isRecord(infobox.urls[0])
        ? infobox.urls[0]
        : undefined;
      const url = typeof infobox.url === "string"
        ? infobox.url
        : typeof infobox.id === "string" && infobox.id.startsWith("http")
        ? infobox.id
        : typeof firstLink?.url === "string"
        ? firstLink.url
        : undefined;
      if (!url) {
        continue;
      }

      add({
        url,
        title: typeof infobox.infobox === "string"
          ? infobox.infobox
          : typeof firstLink?.title === "string"
          ? firstLink.title
          : "Information",
        content: typeof infobox.content === "string" ? infobox.content : "",
        engines: typeof infobox.engine === "string" ? [infobox.engine] : [],
      });
    }
  }

  return results;
};

export const searchSearxng = async (
  options: SearchOptions,
): Promise<SearchResult[]> => {
  const {
    serverUrl,
    method,
    query,
    page,
    fetch: fetchImpl = fetch,
    timeoutMs = DEFAULT_SEARCH_TIMEOUT_MS,
  } = options;
  const endpoint = new URL(`${serverUrl.replace(/\/+$/, "")}/search`);
  const params = new URLSearchParams({
    q: query,
    format: "json",
    pageno: String(page),
  });
  const request: RequestInit = {
    method: method.toUpperCase(),
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  };

  if (method === "get") {
    endpoint.search = params.toString();
  } else {
    request.headers = {
      ...request.headers,
      "Content-Type": "application/x-www-form-urlencoded",
    };
    request.body = params;
  }

  const response = await fetchImpl(endpoint, request);
  if (!response.ok) {
    throw new Error(
      `SearXNG responded with status ${response.status}.`,
    );
  }

  return normalizeSearxngResults(await response.json());
};

const readConfiguration = (): Pick<SearchOptions, "serverUrl" | "method"> => {
  const serverUrl = Deno.env.get("SEARXNG_SERVER_URL");
  if (!serverUrl) {
    throw new Error("SEARXNG_SERVER_URL is required.");
  }
  new URL(serverUrl);

  const mode = Deno.env.get("SEARXNG_MODE") ?? "json";
  if (mode !== "json") {
    throw new Error('SEARXNG_MODE must be "json".');
  }

  const rawMethod = Deno.env.get("SEARXNG_METHOD") ?? "get";
  if (rawMethod !== "get" && rawMethod !== "post") {
    throw new Error('SEARXNG_METHOD must be "get" or "post".');
  }

  return { serverUrl, method: rawMethod };
};

export const createSearxngMcpServer = () => {
  const configuration = readConfiguration();
  const server = new Server(
    { name: "mortybot-searxng", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({
      tools: [{
        name: SEARCH_TOOL_NAME,
        description:
          "Searches the web using the configured SearXNG search engine.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Concise web-search keywords.",
            },
            page: {
              type: "number",
              minimum: 1,
              default: 1,
              description: "Search result page.",
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
        outputSchema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  title: { type: "string" },
                  content: { type: "string" },
                  engines: { type: "array", items: { type: "string" } },
                },
                required: ["url", "title", "content", "engines"],
              },
            },
          },
          required: ["results"],
        },
      }],
    }));

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      if (request.params.name !== SEARCH_TOOL_NAME) {
        throw new Error(`Unknown tool "${request.params.name}".`);
      }

      const args = request.params.arguments;
      const query = args && typeof args.query === "string"
        ? args.query.trim()
        : "";
      const page = args && typeof args.page === "number" ? args.page : 1;
      if (!query || !Number.isInteger(page) || page < 1) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: "A non-empty query and a positive integer page are required.",
          }],
        };
      }

      try {
        const results = await searchSearxng({
          ...configuration,
          query,
          page,
        });
        const text = results.length === 0
          ? `No search results found for "${query}".`
          : JSON.stringify(results, null, 2);

        return {
          content: [{ type: "text", text }],
          structuredContent: { results },
        };
      } catch (error) {
        const summary = getSafeErrorSummary(error);
        console.error(`SearXNG search failed: ${summary}`);
        return {
          isError: true,
          content: [{ type: "text", text: `Web search failed: ${summary}` }],
        };
      }
    },
  );

  return server;
};

const main = async () => {
  const server = createSearxngMcpServer();
  await server.connect(new StdioServerTransport());
  console.error("MortyBot SearXNG MCP server is running on stdio.");
};

if (import.meta.main) {
  main().catch((error) => {
    console.error(`SearXNG MCP server failed: ${getSafeErrorSummary(error)}`);
    Deno.exit(1);
  });
}
