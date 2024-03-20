export interface MemeTemplateEntry {
  name: string;
  url: string;
  params: MemeTemplateParam[];
}

export interface MemeTemplateParam {
  name: string;
  y: number;
  x: number;
  width: number;
  height: number;
  fontParams: MemeTemplateFontParams;
}

export interface MemeTemplateFontParams {
  fontSize: number;
  fontFamily: string;
  color: string;
  centralize: boolean;
  strokeColor?: string;
}

export interface MemeTemplateSessionData {
  enableMemeTemplateDebug: boolean;
  memeTemplates: Map<string, MemeTemplateEntry>;
}
