import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { getAlbumBuffer, resetAlbumBuffer } from "./albumBuffer.ts";
import { createAlbumBufferMiddleware } from "./albumBufferMiddleware.ts";

Deno.test("an album item is filed as its update arrives", async () => {
  resetAlbumBuffer();
  const context = {
    msg: {
      media_group_id: "album-1",
      photo: [{
        file_id: "photo-1",
        file_unique_id: "u1",
        width: 1,
        height: 1,
      }],
    },
  } as BotContext;
  let nextCalled = false;

  await createAlbumBufferMiddleware()(context, () => {
    nextCalled = true;
    return Promise.resolve();
  });

  assertEquals(nextCalled, true);
  assertEquals(
    getAlbumBuffer().get("album-1").map((attachment) => attachment.fileId),
    ["photo-1"],
  );
});

Deno.test("updates without an album pass through untouched", async () => {
  resetAlbumBuffer();
  const context = { msg: { text: "hello" } } as BotContext;
  let nextCalled = false;

  await createAlbumBufferMiddleware()(context, () => {
    nextCalled = true;
    return Promise.resolve();
  });

  assertEquals(nextCalled, true);
  assertEquals(getAlbumBuffer().size, 0);
});

Deno.test("updates without a message pass through cleanly", async () => {
  resetAlbumBuffer();
  let nextCalled = false;

  await createAlbumBufferMiddleware()({} as BotContext, () => {
    nextCalled = true;
    return Promise.resolve();
  });

  assertEquals(nextCalled, true);
  assertEquals(getAlbumBuffer().size, 0);
});
