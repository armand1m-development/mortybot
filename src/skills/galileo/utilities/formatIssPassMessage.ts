import type { GeoPosition } from "./types.ts";
import type { N2yoVisualPasses } from "../httpClients/types.ts";
import {
  getLanguageLocale,
  type Language,
  type Translate,
} from "/src/i18n/mod.ts";

const formatDate = (date: number, language: Language) => {
  const timestamp = new Date(date * 1000);
  const locale = getLanguageLocale(language);

  return {
    date: timestamp.toLocaleDateString(locale),
    time: timestamp.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const generateMagnitudeBar = (mag: number) => {
  if (mag > 0) return "*";
  const roundedMag = Math.floor(Math.abs(mag));
  const fillSpace = Array(roundedMag).fill("█");
  const emptySpace = Array(10 - roundedMag).fill("▒");

  return [...fillSpace, ...emptySpace].join("");
};

const formatPassDuration = (duration: number, translate: Translate) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60).toString().padStart(2, "0");
  return translate("galileo.duration", { minutes, seconds });
};

export const formatIssPassMessage = (
  position: GeoPosition,
  passes: N2yoVisualPasses["passes"],
  translate: Translate,
  language: Language,
) => {
  if (passes === undefined || passes.length == 0) {
    return translate("galileo.noPasses", {
      latitude: position.latitude,
      longitude: position.longitude,
    });
  }

  return passes.map((pass) =>
    translate("galileo.pass", {
      date: formatDate(pass.startUTC, language).date,
      duration: formatPassDuration(pass.duration, translate),
      endAzimuth: Math.floor(pass.endAz),
      endCompass: pass.endAzCompass,
      endElevation: pass.endEl,
      endTime: formatDate(pass.endUTC, language).time,
      magnitude: pass.mag,
      magnitudeBar: generateMagnitudeBar(pass.mag),
      maxAzimuth: Math.floor(pass.maxAz),
      maxCompass: pass.maxAzCompass,
      maxElevation: pass.maxEl,
      maxTime: formatDate(pass.maxUTC, language).time,
      startAzimuth: Math.floor(pass.startAz),
      startCompass: pass.startAzCompass,
      startElevation: pass.startEl,
      startTime: formatDate(pass.startUTC, language).time,
    })
  ).join("\n\n");
};
