import { getLogger } from "@std/log";
import { chatCompletion } from "../httpClients/chatCompletion.ts";
import { messageText } from "../httpClients/types.ts";
import type { OpenAiContentPart, OpenAiMessage } from "../httpClients/types.ts";
import { toDataUri } from "./prepareImage.ts";
import type { VisionImage } from "./types.ts";

const logger = () => getLogger();

/**
 * Descriptions are written to be re-read later, not to be shown. They stay in
 * the conversation history for the rest of the chat's life, so they are capped
 * tightly: a paragraph per image is enough to answer follow-up questions, and
 * anything longer is history budget spent on one photo.
 */
const VISION_MAX_TOKENS = 400;

/** Low, because this is a description task and invention is the failure mode. */
const VISION_TEMPERATURE = 0.2;

const VISION_SYSTEM_PROMPT = [
  "You describe images for a Telegram assistant that cannot see them itself.",
  "Report only what is actually visible. Never guess at identities, brands, or text you cannot read.",
  "Be specific and dense: objects, people and what they are doing, setting, weather, lighting, time of day, colours, and any legible text or numbers quoted exactly.",
  "Write plain prose with no markdown, no preamble, and no offer to help.",
  "Describe each image in at most 70 words, prefixed with its label.",
].join("\n");

/**
 * Qwen-style chat templates emit a reasoning block that some servers pass
 * through as content. It is never part of the description.
 */
export const stripThinking = (text: string): string =>
  text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

export interface DescribeImagesParams {
  token: string;
  baseUrl: string;
  model: string;
  images: VisionImage[];
  /** What the assistant already knows about where the images came from. */
  context?: string;
  timeoutMs?: number;
  idleTimeoutMs?: number;
  completion?: typeof chatCompletion;
}

/**
 * Turns images into one block of text.
 *
 * Every image of a turn travels in a single request: an album of road cameras
 * describes better as one scene than as four unrelated photos, and one request
 * costs one round trip instead of four.
 */
export const describeImages = async (
  params: DescribeImagesParams,
): Promise<string> => {
  const {
    token,
    baseUrl,
    model,
    images,
    context,
    timeoutMs,
    idleTimeoutMs,
    completion = chatCompletion,
  } = params;

  if (images.length === 0) {
    return "";
  }

  const instruction = [
    context
      ? `These images were just posted in a Telegram chat. Context: ${context}`
      : "These images were just posted in a Telegram chat.",
    images.length === 1
      ? "Describe it."
      : `Describe all ${images.length} images, in order.`,
  ].join(" ");

  const content: OpenAiContentPart[] = [
    { type: "text", text: instruction },
    ...images.flatMap((image): OpenAiContentPart[] => [
      { type: "text", text: `${image.label}:` },
      { type: "image_url", image_url: { url: toDataUri(image) } },
    ]),
  ];

  const messages: OpenAiMessage[] = [
    { role: "system", content: VISION_SYSTEM_PROMPT },
    { role: "user", content },
  ];

  const { message } = await completion({
    token,
    baseUrl,
    model,
    messages,
    temperature: VISION_TEMPERATURE,
    maxTokens: VISION_MAX_TOKENS,
    // A description is a lookup, not a puzzle; thinking would only add latency
    // to a call the user is already waiting on.
    chatTemplateKwargs: { enable_thinking: false },
    ...(timeoutMs !== undefined ? { timeoutMs } : {}),
    ...(idleTimeoutMs !== undefined ? { idleTimeoutMs } : {}),
  });

  const description = stripThinking(messageText(message.content));

  if (description.length === 0) {
    logger().warn("The vision model returned an empty description.");
  }

  return description;
};
