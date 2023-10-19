import { N2yoVisualPasses } from "../httpClients/types.ts";

const formatDate = (date: number) => {
  const timestamp = new Date(date * 1000);

  return {
    date: timestamp.toLocaleDateString("pt-br"),
    time: timestamp.toLocaleTimeString("pt-br", {
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

  console.log(
    "%cformatIssPassMessage.ts line:18 object",
    "color: #007acc;",
    fillSpace,
  );
  console.log(
    "%cformatIssPassMessage.ts line:18 object",
    "color: #007acc;",
    emptySpace,
  );

  return [...fillSpace, ...emptySpace].join("");
};

const formatPassDuration = (duration: number) => {
  return `${Math.floor(duration / 60)}:${
    Intl.NumberFormat("pt-br", {
      minimumIntegerDigits: 2,
    }).format(Math.floor(duration & 60))
  } minutes`;
};

const sateliteEmoji = "\uD83D\uDEF0\uFE0F";

export const formatIssPassMessage = (passes: N2yoVisualPasses["passes"]) => {
  if (passes === undefined || passes.length == 0) {
    return "There are no passes for this location in the horizon for the upcoming 3 days.";
  }

  const fullMessage = passes.reduce((acc, pass) => {
    const message = `${sateliteEmoji} ISS pass on day: ${
      formatDate(pass.startUTC).date
    }

    Starts at:  ${formatDate(pass.startUTC).time}  ${pass.startAzCompass}/${
      Math.floor(pass.startAz)
    }°  elev: ${pass.startEl}°
    Max elev:  ${formatDate(pass.maxUTC).time}  ${pass.maxAzCompass}/${
      Math.floor(pass.maxAz)
    }°  elev: ${pass.maxEl}°
    Ends at:  ${formatDate(pass.endUTC).time}  ${pass.endAzCompass}/${
      Math.floor(pass.endAz)
    }°  elev: ${pass.endEl}°
    
    Size in the sky: ${generateMagnitudeBar(pass.mag)}
    Magnitude: ${pass.mag}
    Total duration: ${formatPassDuration(pass.duration)}
    `;

    return acc + "\n\n" + message;
  }, "");

  return fullMessage;
};
