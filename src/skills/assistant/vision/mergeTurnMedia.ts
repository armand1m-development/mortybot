import type { MediaAttachment } from "./types.ts";

/**
 * Combines the media a turn should see into one ordered list: what the user
 * replied to first, then their own.
 *
 * Reply media leads so the per-turn vision budget, applied to the merged
 * list, truncates the user's own and less relevant media rather than what
 * they explicitly pointed at. Duplicates by file id are dropped, keeping the
 * first occurrence so reply provenance survives the merge.
 */
export const mergeTurnMedia = (
  replyMedia: MediaAttachment[],
  attached: MediaAttachment[],
): MediaAttachment[] => {
  const seen = new Set<string>();
  const merged: MediaAttachment[] = [];

  for (const attachment of [...replyMedia, ...attached]) {
    if (seen.has(attachment.fileId)) {
      continue;
    }
    seen.add(attachment.fileId);
    merged.push(attachment);
  }

  return merged;
};
