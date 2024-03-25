import sharp from "sharp";
import { ParsedQuery } from "querystring";
import { getBoundedChunks } from "./boundary.ts";
import { createSvgOverlay } from "./svg.ts";
import { MemeTemplateParam } from "../../sessionData/types.ts";

export interface OverlayContextProps {
  metadata: sharp.Metadata;
  texts: ParsedQuery<string>;
  debug?: boolean;
}

export const createOverlayContext = (
  { metadata, texts, debug }: OverlayContextProps,
) => {
  const intoOverlay = (textParams: MemeTemplateParam) => {
    const { name, width, height, x, y, fontParams } = textParams;

    const text = texts[name];

    const missingParam = !textParams.fontParams.optional &&
      (!text || typeof text !== "string");

    if (missingParam) {
      throw new Error(
        `You must provide a text value for the parameter '${name}' for an overlay to be created.`,
      );
    }

    const hasHorizontalOverflow = x + width > metadata.width!;
    const clippedWidth = metadata.width! - x;

    const textWidth = hasHorizontalOverflow ? clippedWidth : width;

    const { chunks, dynamicFontSize } = getBoundedChunks({
      text: text?.toString() ?? "",
      boxWidth: width,
      fontSize: fontParams.fontSize,
    });

    const svgOverlay = createSvgOverlay({
      chunks,
      dynamicFontSize,
      textParams,
      textWidth,
      textHeight: height,
      debug,
    });

    const overlay: sharp.OverlayOptions = {
      input: new TextEncoder().encode(svgOverlay),
      top: y,
      left: x,
    };

    return overlay;
  };

  return {
    intoOverlay,
  };
};
