export type IssPass = {
  startAz: number;
  startAzCompass: string;
  startEl: number;
  startUTC: number;
  maxAz: number;
  maxAzCompass: string;
  maxEl: number;
  maxUTC: number;
  endAz: number;
  endAzCompass: string;
  endEl: number;
  endUTC: number;
  mag: number;
  duration: number;
  startVisibility: number;
};

export type N2yoVisualPasses = {
  info: {
    satid: number;
    satname: string;
    transactionscount: number;
    passescount: number;
  };
  passes: IssPass[] | undefined;
};
