/**
 * Telegram only understands a small, quirky subset of Markdown, so model
 * responses written in regular CommonMark (headings, `**bold**`, nested lists,
 * tables) either render literally or make `sendMessage` fail outright with an
 * entity parse error. Converting to Telegram's HTML flavour instead is far
 * more robust: every character that is not part of a tag we emit is escaped,
 * so unbalanced markers in the model output can no longer break the message.
 *
 * Supported by Telegram HTML: b, i, u, s, tg-spoiler, a, code, pre and
 * blockquote. Everything else (headings, lists, tables, rules) is flattened
 * into text that reads well in a chat bubble.
 */

const PLACEHOLDER = "\uE000";

export const escapeTelegramHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const BULLETS = ["•", "◦", "▪"];

const applyEmphasis = (text: string): string =>
  text
    .replace(/(\*\*\*|___)(?=\S)([\s\S]*?\S)\1/g, "<b><i>$2</i></b>")
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "<b>$2</b>")
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<s>$1</s>")
    .replace(/\|\|(?=\S)([\s\S]*?\S)\|\|/g, "<tg-spoiler>$1</tg-spoiler>")
    .replace(/(?<![\w*])\*(?=\S)([^*\n]*?\S)\*(?!\w)/g, "<i>$1</i>")
    .replace(/(?<![\w_])_(?=\S)([^_\n]*?\S)_(?!\w)/g, "<i>$1</i>");

const isSafeUrl = (url: string): boolean =>
  /^(https?:\/\/|tg:\/\/|mailto:|tel:)/i.test(url);

/**
 * Renders the inline span of a single block: code spans and links are pulled
 * out into placeholders first so that emphasis markers inside URLs (a very
 * common source of broken output, e.g. `some_page_name`) are left alone.
 */
const renderInline = (text: string): string => {
  const tokens: string[] = [];
  const store = (html: string): string =>
    `${PLACEHOLDER}${tokens.push(html) - 1}${PLACEHOLDER}`;

  let working = text.replace(
    /(`+)([\s\S]+?)\1/g,
    (_match, _fence: string, code: string) =>
      store(`<code>${escapeTelegramHtml(code.replace(/^ | $/g, ""))}</code>`),
  );

  working = escapeTelegramHtml(working);

  working = working.replace(
    /!?\[([^\]]*)\]\(\s*(?:&lt;)?([^()\s]+?)(?:&gt;)?(?:\s+&quot;[^&]*&quot;)?\s*\)/g,
    (match, label: string, url: string) => {
      if (!isSafeUrl(url)) {
        return match;
      }

      const content = applyEmphasis(label).trim();
      return store(
        `<a href="${url}">${content.length > 0 ? content : url}</a>`,
      );
    },
  );

  working = applyEmphasis(working);

  let restored = working;
  for (let pass = 0; pass < 3 && restored.includes(PLACEHOLDER); pass++) {
    restored = restored.replace(
      new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, "g"),
      (match, index: string) => tokens[Number(index)] ?? match,
    );
  }

  return restored;
};

const FENCE_PATTERN = /^\s{0,3}(```+|~~~+)\s*([^\s`]*)/;
const HEADING_PATTERN = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE_PATTERN = /^\s{0,3}([-*_])\s*(?:\1\s*){2,}$/;
const QUOTE_PATTERN = /^\s{0,3}>\s?/;
const UNORDERED_PATTERN = /^(\s*)[-*+]\s+(.*)$/;
const ORDERED_PATTERN = /^(\s*)(\d{1,3})[.)]\s+(.*)$/;
const TABLE_ROW_PATTERN = /^\s*\|(.+)\|\s*$/;
const TABLE_DIVIDER_PATTERN = /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/;

const tableCells = (row: string): string[] =>
  row.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((cell) =>
    cell.trim()
  );

interface RenderOptions {
  /** Blockquotes cannot nest, and code blocks inside them are unreliable. */
  allowBlocks: boolean;
}

const renderLines = (lines: string[], options: RenderOptions): string[] => {
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const fence = options.allowBlocks ? line.match(FENCE_PATTERN) : null;

    if (fence) {
      const closing = fence[1][0] === "`"
        ? /^\s{0,3}```+\s*$/
        : /^\s{0,3}~~~+\s*$/;
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !closing.test(lines[index])) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1;

      const language = fence[2].toLowerCase();
      const open = language.length > 0
        ? `<pre><code class="language-${escapeTelegramHtml(language)}">`
        : "<pre>";
      const close = language.length > 0 ? "</code></pre>" : "</pre>";
      output.push(`${open}${escapeTelegramHtml(body.join("\n"))}${close}`);
      continue;
    }

    if (options.allowBlocks && QUOTE_PATTERN.test(line)) {
      const body: string[] = [];
      while (index < lines.length && QUOTE_PATTERN.test(lines[index])) {
        body.push(lines[index].replace(QUOTE_PATTERN, ""));
        index += 1;
      }
      const inner = renderLines(body, { allowBlocks: false }).join("\n");
      output.push(`<blockquote>${inner}</blockquote>`);
      continue;
    }

    index += 1;

    const heading = line.match(HEADING_PATTERN);
    if (heading) {
      output.push(`<b>${renderInline(heading[2])}</b>`);
      continue;
    }

    if (RULE_PATTERN.test(line)) {
      output.push("———");
      continue;
    }

    const tableRow = line.match(TABLE_ROW_PATTERN);
    if (tableRow) {
      if (TABLE_DIVIDER_PATTERN.test(line)) {
        continue;
      }
      const cells = tableCells(tableRow[0]).map(renderInline).join(" | ");
      const isHeader = TABLE_DIVIDER_PATTERN.test(lines[index] ?? "");
      output.push(isHeader ? `<b>${cells}</b>` : cells);
      continue;
    }

    const ordered = line.match(ORDERED_PATTERN);
    if (ordered) {
      const depth = Math.min(Math.floor(ordered[1].length / 2), 2);
      output.push(
        `${"  ".repeat(depth)}${ordered[2]}. ${renderInline(ordered[3])}`,
      );
      continue;
    }

    const unordered = line.match(UNORDERED_PATTERN);
    if (unordered) {
      const depth = Math.min(Math.floor(unordered[1].length / 2), 2);
      output.push(
        `${"  ".repeat(depth)}${BULLETS[depth]} ${renderInline(unordered[2])}`,
      );
      continue;
    }

    output.push(renderInline(line));
  }

  return output;
};

/**
 * Converts the CommonMark that language models write into the HTML subset
 * Telegram accepts as `parse_mode: "HTML"`.
 */
export const markdownToTelegramHtml = (markdown: string): string => {
  const normalized = markdown
    .replace(/\r\n?/g, "\n")
    .replaceAll(PLACEHOLDER, "");

  return renderLines(normalized.split("\n"), { allowBlocks: true })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Degrades already converted HTML back into readable plain text, used when
 * Telegram rejects a message and it has to be re-sent without a parse mode.
 */
export const telegramHtmlToPlainText = (html: string): string =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (match, entity: string) => {
      if (entity.startsWith("#")) {
        const code = /^#x/i.test(entity)
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return HTML_ENTITIES[entity.toLowerCase()] ?? match;
    });
