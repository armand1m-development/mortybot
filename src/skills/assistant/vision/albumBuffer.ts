import type { MediaAttachment } from "./types.ts";

/**
 * How long to wait for the rest of an album before describing it.
 *
 * Telegram delivers an album as one update per item, so the message carrying
 * the question arrives without its siblings. They follow within a few hundred
 * milliseconds; this is a short, bounded wait rather than a guess at the count,
 * which Telegram never tells us.
 */
export const ALBUM_COLLECTION_WAIT_MS = 1_200;

/** Albums older than this are forgotten — nobody replies to one that late. */
export const ALBUM_ENTRY_TTL_MS = 60_000;

const MAX_TRACKED_ALBUMS = 100;

interface AlbumEntry {
  attachments: MediaAttachment[];
  updatedAt: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Short-lived memory of the media items seen for each Telegram album.
 *
 * Deliberately in-process and lossy: it exists to make one turn see all the
 * photos of an album, not to be a record of anything.
 */
export class AlbumBuffer {
  private readonly albums = new Map<string, AlbumEntry>();

  constructor(
    private readonly ttlMs: number = ALBUM_ENTRY_TTL_MS,
    private readonly maxAlbums: number = MAX_TRACKED_ALBUMS,
  ) {}

  remember(
    mediaGroupId: string,
    attachments: MediaAttachment[],
    now: number = Date.now(),
  ): void {
    this.prune(now);

    const entry = this.albums.get(mediaGroupId) ??
      { attachments: [], updatedAt: now };
    for (const attachment of attachments) {
      if (
        !entry.attachments.some((known) => known.fileId === attachment.fileId)
      ) {
        entry.attachments.push(attachment);
      }
    }
    entry.updatedAt = now;

    // Re-inserting moves the album to the end, so the eviction below always
    // drops the least recently touched one.
    this.albums.delete(mediaGroupId);
    this.albums.set(mediaGroupId, entry);

    while (this.albums.size > this.maxAlbums) {
      const oldest = this.albums.keys().next();
      if (oldest.done) break;
      this.albums.delete(oldest.value);
    }
  }

  get(mediaGroupId: string): MediaAttachment[] {
    return [...(this.albums.get(mediaGroupId)?.attachments ?? [])];
  }

  prune(now: number = Date.now()): void {
    for (const [id, entry] of this.albums) {
      if (now - entry.updatedAt > this.ttlMs) {
        this.albums.delete(id);
      }
    }
  }

  get size(): number {
    return this.albums.size;
  }
}

let buffer: AlbumBuffer | undefined;

export const getAlbumBuffer = (): AlbumBuffer => buffer ??= new AlbumBuffer();

/** Test seam: drops everything the buffer is holding. */
export const resetAlbumBuffer = (): void => {
  buffer = undefined;
};

/**
 * Waits out the album's remaining items, then returns everything seen for it.
 *
 * The siblings are filed by `createAlbumBufferMiddleware`, which runs in
 * bot.ts before the per-chat `sequentialize` lock, so they reach the buffer
 * even while this wait holds the chat's serialized chain. The wait itself is
 * only ever paid by a message that is part of an album and is actually
 * addressed to the bot, and is bounded at ALBUM_COLLECTION_WAIT_MS.
 */
export const collectAlbumAttachments = async (
  mediaGroupId: string,
  options: {
    waitMs?: number;
    wait?: (ms: number) => Promise<unknown>;
    albums?: AlbumBuffer;
  } = {},
): Promise<MediaAttachment[]> => {
  const {
    waitMs = ALBUM_COLLECTION_WAIT_MS,
    wait = sleep,
    albums = getAlbumBuffer(),
  } = options;

  await wait(waitMs);

  return albums.get(mediaGroupId);
};
