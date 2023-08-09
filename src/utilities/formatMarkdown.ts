export type Formatter = {
  parse_mode: "HTML" | "Markdown" | "MarkdownV2";
  bold: (text: string) => string;
  escape: (text: string) => string;
  italic: (text: string) => string;
  monospace: (text: string) => string;
  monospaceBlock: (text: string, programmingLanguage?: string) => string;
  spoiler: (text: string) => string;
  strikethrough: (text: string) => string;
  underline: (text: string) => string;
  url: (label: string, url: string) => string;
  userMention: (label: string, userId: number) => string;
};

function escape(text: string): string {
  return text.replace(/[*_`[\]()]/g, "");
}

function bold(text: string): string {
  return `*${text.replace(/\*/g, "")}*`;
}

function italic(text: string): string {
  return `_${text.replace(/_/g, "")}_`;
}

function strikethrough(_text: string): string {
  throw new Error(
    "strikethrough is not supported by Markdown. Use MarkdownV2 instead.",
  );
}

function underline(_text: string): string {
  throw new Error(
    "underline is not supported by Markdown. Use MarkdownV2 instead.",
  );
}

function spoiler(_text: string): string {
  throw new Error(
    "spoiler is not supported by Markdown. Use MarkdownV2 instead.",
  );
}

function monospace(text: string): string {
  return "`" + text.replace(/`/g, "") + "`";
}

function monospaceBlock(text: string, programmingLanguage?: string): string {
  let result = "";
  result += "```";

  if (programmingLanguage) {
    result += programmingLanguage;
  }

  result += "\n";
  result += text.replace(/```/g, "");
  result += "\n";
  result += "```";
  return result;
}

function url(label: string, url: string): string {
  return `[${label.replace(/]/, "")}](${url.replace(/\)/, "")})`;
}

function userMention(label: string, userId: number): string {
  return url(label, `tg://user?id=${userId}`);
}

export const markdown: Formatter = {
  parse_mode: "Markdown",
  escape,
  bold,
  italic,
  strikethrough,
  underline,
  spoiler,
  monospace,
  monospaceBlock,
  url,
  userMention,
};
