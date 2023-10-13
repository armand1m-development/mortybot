import { N2yoVisualPasses } from "../httpClients/types.ts";

const formatDate = (date: number) => {
  const timestamp = new Date(date * 1000);

  return {
    date: timestamp.toLocaleDateString(),
    time: timestamp.toLocaleTimeString(),
  };
};

const generateMagnitudeBar = (mag: number) => {
  if (mag > 0) return "*";
  return Array(Math.floor(Math.abs(mag)))
    .fill("#")
    .join("");
};

const sateliteEmoji = "\uD83D\uDEF0\uFE0F";

export const formatIssPassMessage = (passes: N2yoVisualPasses["passes"]) => {
  const fullMessage = passes.reduce((acc, pass) => {
    const message = `${sateliteEmoji} ISS pass on day: ${
      formatDate(pass.startUTC).date
    }

    Starts at:            ${formatDate(pass.startUTC).time}  ${
      pass.startAzCompass
    }/${Math.floor(pass.startAz)}°  elevation: ${pass.startEl}°
    Max elevation:  ${formatDate(pass.maxUTC).time}  ${
      pass.maxAzCompass
    }/${Math.floor(pass.maxAz)}°  elevation: ${pass.maxEl}°
    Ends at:              ${formatDate(pass.endUTC).time}  ${
      pass.endAzCompass
    }/${Math.floor(pass.endAz)}°  elevation: ${pass.endEl}°
    
    Size in the sky: ${generateMagnitudeBar(pass.mag)}
    Magnitude: ${pass.mag}
    Total duration: ${Math.floor(pass.duration / 60)}:${Math.floor(
      pass.duration & 60
    )} minutes
    `;

    return acc + "\n\n" + message;
  }, "");

  return fullMessage;
};
