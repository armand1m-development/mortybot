import { MemeTemplateParam } from "../../sessionData/types.ts";

export interface SvgOverlayProps {
  textWidth: number;
  textHeight: number;
  textParams: MemeTemplateParam;
  dynamicFontSize: number;
  chunks: string[];
  debug?: boolean;
}

interface TextSpanProps {
  chunks: string[];
  centralize: boolean;
  textWidth: number;
}

const renderTextSpans = ({ chunks, textWidth, centralize }: TextSpanProps) => {
  const spanX = centralize ? textWidth / 2 : 0;
  return chunks
    .map((chunk) => `<tspan x="${spanX}" dy="1em">${chunk}</tspan>`)
    .join("");
};

export const createSvgOverlay = ({
  chunks,
  textHeight,
  textWidth,
  textParams,
  dynamicFontSize,
  debug = false,
}: SvgOverlayProps) => {
  const debugRect = `
    <rect
      x="0"
      y="0"
      width="${textWidth}"
      height="${textHeight}"
      fill="transparent"
      stroke="red"
      stroke-width="4"
    />
  `;

  const { color, fontFamily, centralize, optional, strokeColor } =
    textParams.fontParams;

  const strokeParams = `
    stroke="${strokeColor}"
    stroke-width="1"
  `;

  const fontParams = `
    fill="${color}"
    font-size="${dynamicFontSize}"
    font-family="${fontFamily}"
  `;
  const alignCenterParams = `
    x="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    alignment-baseline="middle"
  `;

  const alignLeftParams = `
    width="${textWidth}"
  `;

  const injectDebugRect = debug ? debugRect : "";
  const injectStrokeParams = strokeColor ? strokeParams : "";
  const injectAlignment = centralize ? alignCenterParams : alignLeftParams;

  const wrapper = (content: string) => `
    <svg width="${textWidth}" height="${textHeight}">
      ${content}
    </svg>
  `;

  const isNoop = optional && chunks.length === 0;

  if (isNoop) {
    return wrapper(injectDebugRect);
  }

  return wrapper(`
    ${injectDebugRect}
    <text
      ${fontParams}
      ${injectAlignment}
      ${injectStrokeParams}
    >
      ${renderTextSpans({ chunks, centralize, textWidth })}
    </text>
  `);
};
