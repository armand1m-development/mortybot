import { assert, assertEquals } from "@std/assert";
import { buildFfmpegArgs } from "./extractVideoFrames.ts";

const argumentValue = (args: string[], flag: string): string | undefined =>
  args[args.indexOf(flag) + 1];

Deno.test("a video of known length is sampled across its whole duration", () => {
  const args = buildFfmpegArgs({
    inputPath: "/tmp/source",
    outputPattern: "/tmp/frame-%03d.jpg",
    frames: 4,
    durationSeconds: 10,
  });

  // 4 frames over 10 seconds is one every 2.5s, so the last lands at 7.5s
  // rather than all four coming out of the opening moment.
  assert(argumentValue(args, "-vf")?.startsWith("fps=0.4000"));
  assertEquals(argumentValue(args, "-frames:v"), "4");
  assertEquals(argumentValue(args, "-i"), "/tmp/source");
  assertEquals(args.at(-1), "/tmp/frame-%03d.jpg");
});

Deno.test("without a duration ffmpeg picks the representative frames", () => {
  const args = buildFfmpegArgs({
    inputPath: "/tmp/source",
    outputPattern: "/tmp/frame-%03d.jpg",
    frames: 3,
  });

  assert(argumentValue(args, "-vf")?.startsWith("thumbnail=100"));
  assertEquals(argumentValue(args, "-frames:v"), "3");
});

Deno.test("frames are scaled down before they become prompt tokens", () => {
  const args = buildFfmpegArgs({
    inputPath: "/tmp/source",
    outputPattern: "/tmp/frame-%03d.jpg",
    frames: 1,
    maxDimension: 512,
  });

  assert(
    argumentValue(args, "-vf")?.endsWith(
      "scale=512:512:force_original_aspect_ratio=decrease",
    ),
  );
});

Deno.test("a nonsensical frame count still asks for one frame", () => {
  const args = buildFfmpegArgs({
    inputPath: "/tmp/source",
    outputPattern: "/tmp/frame-%03d.jpg",
    frames: 0,
  });

  assertEquals(argumentValue(args, "-frames:v"), "1");
});
