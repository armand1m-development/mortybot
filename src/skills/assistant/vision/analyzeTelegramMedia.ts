import { getLogger } from "@std/log";
import type { BotContext } from "/src/context/mod.ts";
import { describeImages } from "./describeImages.ts";
import {
  collectVisionImages,
  type TelegramFileDownloader,
} from "./collectVisionImages.ts";
import type { MediaAttachment } from "./types.ts";

const logger = () => getLogger();

/**
 * Ceiling for one description request. Well under the turn budget: the user is
 * already watching a progress message, and a stalled vision call must not be
 * what keeps them waiting.
 */
export const VISION_REQUEST_TIMEOUT_MS = 120_000;

export const createTelegramFileDownloader = (
  ctx: BotContext,
): TelegramFileDownloader =>
async (fileId) => {
  const file = await ctx.api.getFile(fileId);
  const response = await fetch(file.getUrl());
  if (!response.ok) {
    throw new Error(
      `Failed to download Telegram file ${fileId}: HTTP ${response.status}.`,
    );
  }
  return new Uint8Array(await response.arrayBuffer());
};

export interface AnalyzeTelegramMediaOptions {
  /** Where the media came from, handed to the model as context. */
  context?: string;
  download?: TelegramFileDownloader;
}

/**
 * Describes Telegram media with the assistant's own model.
 *
 * Always resolves: vision is an enrichment, so a missing model, an oversized
 * file or a failed request degrades the turn to a text-only one instead of
 * failing it. Returns undefined when there is nothing to say.
 */
export const analyzeTelegramMedia = async (
  ctx: BotContext,
  attachments: MediaAttachment[],
  options: AnalyzeTelegramMediaOptions = {},
): Promise<string | undefined> => {
  const {
    assistantVisionEnabled,
    assistantVisionMaxImages,
    assistantVideoFrames,
    assistantStreamIdleTimeoutMs,
    openAiApiKey,
    openAiBaseUrl,
    openAiModel,
  } = ctx.configuration;

  if (!assistantVisionEnabled || attachments.length === 0) {
    return undefined;
  }

  try {
    const images = await collectVisionImages(
      options.download ?? createTelegramFileDownloader(ctx),
      attachments,
      {
        maxImages: assistantVisionMaxImages,
        videoFrames: assistantVideoFrames,
      },
    );

    if (images.length === 0) {
      return undefined;
    }

    const description = await describeImages({
      token: openAiApiKey,
      baseUrl: openAiBaseUrl,
      model: openAiModel,
      images,
      ...(options.context ? { context: options.context } : {}),
      timeoutMs: VISION_REQUEST_TIMEOUT_MS,
      idleTimeoutMs: assistantStreamIdleTimeoutMs,
    });

    return description.length > 0 ? description : undefined;
  } catch (error) {
    logger().error("Failed to describe Telegram media.");
    logger().error(error);
    return undefined;
  }
};
