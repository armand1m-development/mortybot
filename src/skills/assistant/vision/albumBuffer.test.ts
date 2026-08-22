import { assertEquals } from "@std/assert";
import { AlbumBuffer, collectAlbumAttachments } from "./albumBuffer.ts";
import type { MediaAttachment } from "./types.ts";

const photo = (fileId: string): MediaAttachment => ({
  kind: "photo",
  fileId,
  mediaGroupId: "album",
});

Deno.test("an album gathers the items of every update it arrives in", () => {
  const albums = new AlbumBuffer();
  albums.remember("album", [photo("a")], 1_000);
  albums.remember("album", [photo("b")], 1_100);
  // Telegram can redeliver an update; the same file must not be described twice.
  albums.remember("album", [photo("b")], 1_200);

  assertEquals(albums.get("album").map((item) => item.fileId), ["a", "b"]);
  assertEquals(albums.get("other"), []);
});

Deno.test("albums are forgotten once nobody could be replying to them", () => {
  const albums = new AlbumBuffer(60_000);
  albums.remember("album", [photo("a")], 1_000);
  albums.remember("later", [photo("b")], 100_000);

  assertEquals(albums.get("album"), []);
  assertEquals(albums.size, 1);
});

Deno.test("the buffer drops the least recently touched album when full", () => {
  const albums = new AlbumBuffer(60_000, 2);
  albums.remember("first", [photo("a")], 1_000);
  albums.remember("second", [photo("b")], 1_010);
  albums.remember("first", [photo("c")], 1_020);
  albums.remember("third", [photo("d")], 1_030);

  assertEquals(albums.size, 2);
  assertEquals(albums.get("second"), []);
  assertEquals(albums.get("first").length, 2);
  assertEquals(albums.get("third").length, 1);
});

Deno.test("collecting an album waits for its remaining items", async () => {
  const albums = new AlbumBuffer();
  albums.remember("album", [photo("a")]);

  const collected = await collectAlbumAttachments("album", {
    albums,
    wait: () => {
      albums.remember("album", [photo("b")]);
      return Promise.resolve();
    },
  });

  assertEquals(collected.map((item) => item.fileId), ["a", "b"]);
});
