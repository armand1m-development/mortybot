import { getLogger } from "@std/log";

const logger = () => getLogger();

const cache = new Map<string, Promise<string>>();

/**
 * Loads a markdown document relative to this file and caches its contents for
 * the process lifetime. Returns an empty string if the file cannot be read.
 */
export const loadMarkdownDoc = (relativePath: string): Promise<string> => {
  const url = new URL(relativePath, import.meta.url);

  let cached = cache.get(url.href);
  if (!cached) {
    cached = (async () => {
      try {
        return await Deno.readTextFile(url);
      } catch (error) {
        logger().error(
          `Failed to load "${relativePath}" for the assistant system prompt.`,
        );
        logger().error(error);
        return "";
      }
    })();
    cache.set(url.href, cached);
  }

  return cached;
};
