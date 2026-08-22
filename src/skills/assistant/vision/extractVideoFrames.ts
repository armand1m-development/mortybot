import { getLogger } from "@std/log";
import { join } from "@std/path";
import { VISION_MAX_DIMENSION } from "./prepareImage.ts";

const logger = () => getLogger();

/** How long ffmpeg may take before the frames are given up on. */
export const FFMPEG_TIMEOUT_MS = 30_000;

const FRAME_PREFIX = "frame-";

export interface FfmpegArgsOptions {
  inputPath: string;
  outputPattern: string;
  frames: number;
  durationSeconds?: number;
  maxDimension?: number;
}

/**
 * Builds the argument list for a single-pass frame extraction.
 *
 * When Telegram tells us how long the video is, frames are sampled at an even
 * cadence across the whole thing, so a description covers the clip rather than
 * just its opening moment. Without a duration — animations and some documents
 * carry none — ffmpeg's own `thumbnail` filter picks representative frames
 * instead, which needs no arithmetic we cannot do.
 */
export const buildFfmpegArgs = (
  {
    inputPath,
    outputPattern,
    frames,
    durationSeconds,
    maxDimension = VISION_MAX_DIMENSION,
  }: FfmpegArgsOptions,
): string[] => {
  const wanted = Math.max(1, Math.floor(frames));
  const scale =
    `scale=${maxDimension}:${maxDimension}:force_original_aspect_ratio=decrease`;
  const sampler = durationSeconds && durationSeconds > 0
    ? `fps=${(wanted / durationSeconds).toFixed(4)}`
    // A window of 100 frames keeps the filter's memory bounded on long clips.
    : "thumbnail=100";

  return [
    "-nostdin",
    "-loglevel",
    "error",
    "-y",
    "-i",
    inputPath,
    "-vf",
    `${sampler},${scale}`,
    "-frames:v",
    String(wanted),
    "-q:v",
    "3",
    "-f",
    "image2",
    outputPattern,
  ];
};

export interface FfmpegResult {
  code: number;
  stderr: string;
}

export type FfmpegRunner = (args: string[]) => Promise<FfmpegResult>;

/** Thrown when ffmpeg is not installed, so callers can degrade rather than fail. */
export class FfmpegUnavailableError extends Error {
  constructor(cause: unknown) {
    super("ffmpeg is not available.");
    this.name = "FfmpegUnavailableError";
    this.cause = cause;
  }
}

export const runFfmpeg: FfmpegRunner = async (args) => {
  const command = new Deno.Command("ffmpeg", {
    args,
    stdin: "null",
    stdout: "null",
    stderr: "piped",
    signal: AbortSignal.timeout(FFMPEG_TIMEOUT_MS),
  });

  try {
    const { code, stderr } = await command.output();
    return { code, stderr: new TextDecoder().decode(stderr) };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new FfmpegUnavailableError(error);
    }
    throw error;
  }
};

export interface ExtractVideoFramesOptions {
  frames: number;
  durationSeconds?: number;
  run?: FfmpegRunner;
}

/**
 * Samples still frames out of a video.
 *
 * Returns an empty array whenever ffmpeg is missing, fails, or produces
 * nothing: a video the assistant cannot open is a reason to fall back to the
 * cover frame Telegram already sent, never a reason to fail the turn.
 */
export const extractVideoFrames = async (
  bytes: Uint8Array,
  { frames, durationSeconds, run = runFfmpeg }: ExtractVideoFramesOptions,
): Promise<Uint8Array[]> => {
  const directory = await Deno.makeTempDir({ prefix: "morty-vision-" });
  const inputPath = join(directory, "source");

  try {
    await Deno.writeFile(inputPath, bytes);

    const result = await run(buildFfmpegArgs({
      inputPath,
      outputPattern: join(directory, `${FRAME_PREFIX}%03d.jpg`),
      frames,
      ...(durationSeconds ? { durationSeconds } : {}),
    }));

    if (result.code !== 0) {
      logger().warn(`ffmpeg exited with code ${result.code}.`);
      logger().debug(result.stderr);
      return [];
    }

    const names: string[] = [];
    for await (const entry of Deno.readDir(directory)) {
      if (entry.isFile && entry.name.startsWith(FRAME_PREFIX)) {
        names.push(entry.name);
      }
    }
    names.sort();

    return await Promise.all(
      names.map((name) => Deno.readFile(join(directory, name))),
    );
  } catch (error) {
    if (error instanceof FfmpegUnavailableError) {
      logger().warn(
        "ffmpeg is not installed, so videos are described from their cover frame only.",
      );
    } else {
      logger().warn("Failed to sample frames from a video.");
      logger().warn(error);
    }
    return [];
  } finally {
    await Deno.remove(directory, { recursive: true }).catch((error) => {
      logger().warn(`Failed to clean up ${directory}.`, error);
    });
  }
};
