import { MemeTemplateParam } from "../../sessionData/types.ts";

export interface SvgOverlayProps {
  textWidth: number;
  textHeight: number;
  textParams: MemeTemplateParam;
  dynamicFontSize: number;
  chunks: string[];
  debug?: boolean;
}

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
      width="${textWidth}"
      height="${textHeight}"
      x="0"
      y="0"
      fill="transparent"
      stroke="red"
      stroke-width="4"
    />
  `;

  const { color, fontFamily, centralize, optional, strokeColor } =
    textParams.fontParams;

  const strokeParams = `
    stroke-width="1"
    stroke="${strokeColor}"
  `;

  const injectDebugRect = debug ? debugRect : "";
  const injectStrokeParams = strokeColor ? strokeParams : "";

  if (optional && chunks.length === 0) {
    return `
      <svg width="${textWidth}" height="${textHeight}">
        ${injectDebugRect}
      </svg>
    `;
  }

  if (centralize) {
    const spanX = textWidth / 2;

    return `
      <svg width="${textWidth}" height="${textHeight}">
        ${injectDebugRect}
        <text
          x="50%"
          font-family="${fontFamily}"
          font-size="${dynamicFontSize}"
          fill="${color}"
          dominant-baseline="middle"
          text-anchor="middle"
          alignment-baseline="middle"
          ${injectStrokeParams}
        >
          ${
      chunks.map((chunk) => `<tspan x="${spanX}" dy="1em">${chunk}</tspan>`)
        .join("")
    }
        </text>
      </svg>
    `;
  }

  return `
    <svg width="${textWidth}" height="${textHeight}">
      ${injectDebugRect}
      <text
        width="${textWidth}"
        font-family="${fontFamily}"
        font-size="${dynamicFontSize}"
        fill="${color}"
        ${injectStrokeParams}
      >
        ${
    chunks.map((chunk) => `<tspan x="0" dy="1em">${chunk}</tspan>`).join("")
  }
      </text>
    </svg>
  `;
};
