import { assert, assertEquals } from "@std/assert";
import {
  appendMediaNotes,
  buildDeliveredMediaHeadline,
  buildMediaHeadline,
  formatMediaMemoryNote,
  MEDIA_NOTE_MAX_LENGTH,
  summarizeAttachments,
} from "./mediaMemory.ts";
import type { MediaAttachment } from "./types.ts";

const attachment = (fields: Partial<MediaAttachment>): MediaAttachment => ({
  kind: "photo",
  fileId: "file",
  ...fields,
});

Deno.test("attachment summaries count each kind", () => {
  assertEquals(summarizeAttachments([attachment({})]), "photo");
  assertEquals(
    summarizeAttachments([attachment({}), attachment({ fileId: "b" })]),
    "2 photos",
  );
  assertEquals(
    summarizeAttachments([
      attachment({}),
      attachment({ fileId: "b" }),
      attachment({ kind: "video", fileId: "c" }),
    ]),
    "2 photos and a video",
  );
});

Deno.test("headlines keep who sent the media and whether it was a reply", () => {
  assertEquals(
    buildMediaHeadline([attachment({ sender: "@armand1m" })]),
    "Attached photo from @armand1m",
  );
  assertEquals(
    buildMediaHeadline([
      attachment({ sender: "@bob", fromReply: true, kind: "video" }),
    ]),
    "The user is replying to video from @bob",
  );
  assertEquals(
    buildDeliveredMediaHeadline(
      [attachment({}), attachment({ fileId: "b" })],
      "tp_now",
    ),
    "2 photos that /tp_now posted here",
  );
});

Deno.test("a mixed list names both the replied-to and the sent media", () => {
  assertEquals(
    buildMediaHeadline([
      attachment({ sender: "@bob", fromReply: true, fileId: "reply" }),
      attachment({ sender: "@armand1m", fileId: "own" }),
    ]),
    "The user is replying to photo from @bob and attached photo from @armand1m",
  );
});

Deno.test("notes are bracketed, collapsed and bounded", () => {
  assertEquals(
    formatMediaMemoryNote("Attached photo", "  a bridge\n  at dusk  "),
    "[Attached photo: a bridge at dusk]",
  );

  const note = formatMediaMemoryNote("Attached photo", "x".repeat(2_000));
  assert(note.length <= MEDIA_NOTE_MAX_LENGTH + 40);
  assert(note.endsWith("…]"));
});

Deno.test("an undescribable attachment still leaves a trace", () => {
  assertEquals(
    formatMediaMemoryNote("Attached photo", "   "),
    "[Attached photo. It could not be described.]",
  );
});

Deno.test("media notes ride along with the assistant's own turn", () => {
  assertEquals(appendMediaNotes("Here you go.", []), "Here you go.");
  assertEquals(
    appendMediaNotes("Here you go.", ["[2 photos: traffic]"]),
    "Here you go.\n\n[2 photos: traffic]",
  );
  assertEquals(appendMediaNotes("", ["[photo: a cat]"]), "[photo: a cat]");
});
