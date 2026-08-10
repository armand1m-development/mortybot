import { assertEquals } from "@std/assert";
import { renderer } from "./mod.ts";

Deno.test("renders an in-memory image with Sharp", async () => {
  const templateImageBuffer = new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">' +
      '<rect width="8" height="8" fill="black"/></svg>',
  ).buffer;

  const image = await renderer({
    templateImageBuffer,
    replyImageBuffer: null,
    stickerImageBuffer: null,
    avatarBuffer: null,
    params: [],
    filteredParams: [],
    texts: {},
  });

  assertEquals([...image.subarray(0, 3)], [0xff, 0xd8, 0xff]);
});
