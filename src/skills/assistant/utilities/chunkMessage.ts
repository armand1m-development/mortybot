const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

/** Tags the converter can leave open across a line break. */
const BLOCK_TAG_PATTERN = /<(\/?)(pre|code|blockquote)(?:\s[^>]*)?>/g;

const tagName = (openTag: string): string =>
  openTag.replace(/^<\s*/, "").split(/[\s>]/, 1)[0].toLowerCase();

const openTags = (stack: string[]): string => stack.join("");

const closeTags = (stack: string[]): string =>
  [...stack].reverse().map((tag) => `</${tagName(tag)}>`).join("");

const trackTags = (line: string, stack: string[]): void => {
  for (const match of line.matchAll(BLOCK_TAG_PATTERN)) {
    if (match[1] === "/") {
      const index = stack.map(tagName).lastIndexOf(match[2].toLowerCase());
      if (index >= 0) {
        stack.splice(index, 1);
      }
      continue;
    }

    stack.push(match[0]);
  }
};

const pendingClose = (stack: string[], line: string): number => {
  const projected = [...stack];
  trackTags(line, projected);
  return closeTags(projected).length;
};

/**
 * True when cutting at `index` would not land in the middle of a tag or of an
 * HTML entity, both of which would produce an unparseable message.
 */
const isSafeBreak = (text: string, index: number): boolean => {
  const lastOpen = text.lastIndexOf("<", index - 1);
  const lastClose = text.lastIndexOf(">", index - 1);
  if (lastOpen > lastClose) {
    return false;
  }

  const lastAmp = text.lastIndexOf("&", index - 1);
  if (lastAmp >= 0 && index - lastAmp <= 12) {
    const semicolon = text.indexOf(";", lastAmp);
    if (semicolon < 0 || semicolon >= index) {
      return false;
    }
  }

  return true;
};

const findBreak = (text: string, limit: number): number => {
  const start = Math.min(limit, text.length);

  for (let index = start; index > Math.max(1, start - 300); index--) {
    if (/\s/.test(text[index - 1]) && isSafeBreak(text, index)) {
      return index;
    }
  }

  for (let index = start; index > 1; index--) {
    if (isSafeBreak(text, index)) {
      return index;
    }
  }

  return start;
};

/**
 * Splits Telegram HTML into chunks that fit within Telegram's maximum message
 * length. Breaks on newlines where possible, and closes and reopens any block
 * tag (`pre`, `code`, `blockquote`) left open at a break, so that every chunk
 * parses on its own.
 */
export const chunkMessage = (
  html: string,
  maxLength = TELEGRAM_MAX_MESSAGE_LENGTH,
): string[] => {
  const chunks: string[] = [];
  const stack: string[] = [];
  let prefix = "";
  let current = "";

  /** Whitespace still counts: dropping it would corrupt code blocks. */
  const hasContent = (chunk: string): boolean =>
    chunk.replace(/<[^>]*>/g, "").length > 0;

  const flush = () => {
    const chunk = current + closeTags(stack);
    if (current.length > prefix.length && hasContent(chunk)) {
      chunks.push(chunk);
    }

    prefix = openTags(stack);
    current = prefix;
  };

  const append = (text: string) => {
    current += current.length > prefix.length ? `\n${text}` : text;
    trackTags(text, stack);
  };

  const budgetFor = (text: string): number =>
    maxLength - current.length - (current.length > prefix.length ? 1 : 0) -
    pendingClose(stack, text);

  /**
   * A partial line may end before the closing tags it contained, so the space
   * reserved for closers has to cover both what is open now and what the line
   * opens along the way.
   */
  const splitBudgetFor = (text: string): number =>
    budgetFor(text) + pendingClose(stack, text) -
    Math.max(closeTags(stack).length, pendingClose(stack, text));

  for (const line of html.split("\n")) {
    if (budgetFor(line) >= line.length) {
      append(line);
      continue;
    }

    flush();

    let remaining = line;
    while (budgetFor(remaining) < remaining.length) {
      const breakAt = findBreak(
        remaining,
        Math.max(1, splitBudgetFor(remaining)),
      );
      append(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt);
      flush();
    }

    append(remaining);
  }

  flush();

  return chunks.length > 0 ? chunks : [html];
};
