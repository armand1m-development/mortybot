import { assertEquals } from "@std/assert";
import { mergeTurnMedia } from "./mergeTurnMedia.ts";
import type { MediaAttachment } from "./types.ts";

const attachment = (fields: Partial<MediaAttachment>): MediaAttachment => ({
  kind: "photo",
  fileId: "file",
  ...fields,
});

Deno.test("reply media is described before the message's own", () => {
  const reply = attachment({ fileId: "reply" });
  const own = attachment({ fileId: "own" });

  assertEquals(mergeTurnMedia([reply], [own]), [reply, own]);
});

Deno.test("duplicates by file id keep the reply occurrence", () => {
  const reply = attachment({ fileId: "same", fromReply: true });
  const own = attachment({ fileId: "same" });
  const other = attachment({ fileId: "other" });

  assertEquals(mergeTurnMedia([reply], [own, other]), [reply, other]);
});

Deno.test("empty and single-side lists pass through", () => {
  const reply = attachment({ fileId: "reply" });
  const own = attachment({ fileId: "own" });

  assertEquals(mergeTurnMedia([], []), []);
  assertEquals(mergeTurnMedia([reply], []), [reply]);
  assertEquals(mergeTurnMedia([], [own]), [own]);
});
