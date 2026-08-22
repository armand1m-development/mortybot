export interface GeneratedCodeFile {
  filename: string;
  content: string;
}

export interface ExtractedCodeFiles {
  text: string;
  files: GeneratedCodeFile[];
}

const CODE_BLOCK_PATTERN = /```([^\n`]*)\r?\n([\s\S]*?)```/g;

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  bash: "sh",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  css: "css",
  dart: "dart",
  go: "go",
  html: "html",
  java: "java",
  javascript: "js",
  js: "js",
  json: "json",
  jsx: "jsx",
  kotlin: "kt",
  lua: "lua",
  markdown: "md",
  md: "md",
  php: "php",
  plaintext: "txt",
  powershell: "ps1",
  python: "py",
  py: "py",
  ruby: "rb",
  rust: "rs",
  shell: "sh",
  sh: "sh",
  sql: "sql",
  swift: "swift",
  ts: "ts",
  tsx: "tsx",
  typescript: "ts",
  xml: "xml",
  yaml: "yaml",
  yml: "yml",
};

const stripFilenameFormatting = (value: string): string =>
  value.trim().replace(/^[`"']|[`"']$/g, "").trim();

const parseFilenameLabel = (
  prefix: string,
): { text: string; filename?: string } => {
  const withoutTrailingWhitespace = prefix.replace(/[\t \r\n]+$/, "");
  const lineStart = withoutTrailingWhitespace.lastIndexOf("\n") + 1;
  const line = withoutTrailingWhitespace.slice(lineStart).trim();
  const fileLabel = line.match(
    /^(?:\*\*)?file(?:name)?(?:\*\*)?\s*:\s*(?:\*\*)?(.+?)(?:\*\*)?$/i,
  );
  const heading = line.match(/^#{1,6}\s+(.+\.[a-z0-9]{1,12})$/i);
  const rawFilename = fileLabel?.[1] ?? heading?.[1];

  if (!rawFilename) {
    return { text: prefix };
  }

  return {
    text: withoutTrailingWhitespace.slice(0, lineStart),
    filename: stripFilenameFormatting(rawFilename),
  };
};

const parseFenceInfo = (
  info: string,
): { language: string; filename?: string } => {
  const trimmed = info.trim();
  const language = trimmed.split(/\s+/, 1)[0]?.toLowerCase() ?? "";
  const filename = trimmed.match(
    /(?:^|\s)(?:file|filename)=(?:"([^"]+)"|'([^']+)'|([^\s]+))/i,
  );

  return {
    language,
    filename: filename
      ? stripFilenameFormatting(filename[1] ?? filename[2] ?? filename[3])
      : undefined,
  };
};

const safeFilename = (filename: string): string => {
  const cleaned = filename.replaceAll("\\", "/").split("/")
    .filter((part) => part.length > 0 && part !== "." && part !== "..")
    .map((part) =>
      part
        .replace(/[^a-zA-Z0-9._ -]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/^\.+/, "")
    )
    .filter((part) => part.length > 0)
    .join("__")
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : "code.txt";
};

const uniqueFilename = (filename: string, used: Set<string>): string => {
  const normalized = safeFilename(filename);
  if (!used.has(normalized.toLowerCase())) {
    used.add(normalized.toLowerCase());
    return normalized;
  }

  const dot = normalized.lastIndexOf(".");
  const stem = dot > 0 ? normalized.slice(0, dot) : normalized;
  const extension = dot > 0 ? normalized.slice(dot) : "";
  let suffix = 2;
  let candidate = `${stem}-${suffix}${extension}`;
  while (used.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${stem}-${suffix}${extension}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
};

/**
 * Removes fenced code blocks from an assistant response and turns each block
 * into a named Telegram document. Explicit `File: path/name.ext` labels or
 * fence `filename=` metadata win; otherwise a name is inferred from language.
 */
export const extractCodeFiles = (markdown: string): ExtractedCodeFiles => {
  const files: GeneratedCodeFile[] = [];
  const textParts: string[] = [];
  const usedFilenames = new Set<string>();
  let cursor = 0;

  for (const match of markdown.matchAll(CODE_BLOCK_PATTERN)) {
    const matchIndex = match.index;
    const prefix = markdown.slice(cursor, matchIndex);
    const label = parseFilenameLabel(prefix);
    const fence = parseFenceInfo(match[1]);
    const extension = LANGUAGE_EXTENSIONS[fence.language] ?? "txt";
    const filename = uniqueFilename(
      fence.filename ?? label.filename ?? `code.${extension}`,
      usedFilenames,
    );

    textParts.push(label.text);
    files.push({ filename, content: match[2] });
    cursor = matchIndex + match[0].length;
  }

  if (files.length === 0) {
    return { text: markdown, files };
  }

  textParts.push(markdown.slice(cursor));
  return {
    text: textParts.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    files,
  };
};
