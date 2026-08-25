import { assert, assertEquals } from "@std/assert";
import type { OpenAiMessage } from "../httpClients/types.ts";
import {
  findDeliveredMediaNoteCommands,
  scrubStaleDeliveredMediaNotes,
  stripDeliveredMediaNotes,
} from "./mediaMemory.ts";

/** The note shape stored on turns before fetch timestamps were added. */
const LEGACY_NOTE =
  `[4 photos that /tp_now posted here: Photo 1: A multi-lane highway under an overcast sky. Text reads "22-08-2026 10:18:05".]`;

/** The current shape, with the fetch timestamp in the headline. */
const TIMESTAMPED_NOTE =
  `[4 photos that /tp_now posted here, fetched 2026-08-22 13:27 UTC: Photo 1: moderate traffic.]`;

Deno.test("delivered-media note commands are found in both note shapes", () => {
  assertEquals(findDeliveredMediaNoteCommands(LEGACY_NOTE), ["tp_now"]);
  assertEquals(findDeliveredMediaNoteCommands(TIMESTAMPED_NOTE), ["tp_now"]);
  assertEquals(
    findDeliveredMediaNoteCommands(
      `${LEGACY_NOTE} and ${TIMESTAMPED_NOTE} again`,
    ),
    ["tp_now", "tp_now"],
  );
});

Deno.test("incoming-media notes and plain text are not matched", () => {
  assertEquals(
    findDeliveredMediaNoteCommands(
      "[Attached photo from @armand1m: a cat. The user is replying to video from @bob]",
    ),
    [],
  );
  assertEquals(
    findDeliveredMediaNoteCommands("The camera feed has been retrieved."),
    [],
  );
});

Deno.test("stripping removes the whole note but keeps the prose", () => {
  assertEquals(
    stripDeliveredMediaNotes(
      `Retrieved.\n\n${LEGACY_NOTE}\n\nAs above, so below.`,
    ),
    "Retrieved.\n\nAs above, so below.",
  );
  assertEquals(
    stripDeliveredMediaNotes("no notes here"),
    "no notes here",
  );
});

Deno.test("scrubbing history replaces stale notes with their stub", () => {
  const history: OpenAiMessage[] = [
    { role: "user", content: "como ta a terceira ponte" },
    {
      role: "assistant",
      content: `The feed has been retrieved.\n\n${TIMESTAMPED_NOTE}`,
    },
    { role: "user", content: "obrigado" },
  ];

  const scrubbed = scrubStaleDeliveredMediaNotes(history);

  assertEquals(
    scrubbed[1].content,
    [
      "The feed has been retrieved.",
      "[/tp_now posted photos in this earlier turn; they are no longer available]",
    ].join("\n\n"),
  );
  // Untouched roles and messages pass through unchanged.
  assertEquals(scrubbed[0], history[0]);
  assertEquals(scrubbed[2], history[2]);
});

Deno.test("scrubbing leaves already-stubbed notes alone", () => {
  const stubbed =
    "[/tp_now posted photos in this earlier turn; they are no longer available]";
  const history: OpenAiMessage[] = [
    { role: "assistant", content: `Text\n\n${stubbed}` },
  ];

  assertEquals(scrubStaleDeliveredMediaNotes(history), history);
  assert(!findDeliveredMediaNoteCommands(stubbed).includes("tp_now"));
});
