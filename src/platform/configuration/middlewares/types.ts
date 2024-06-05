export interface Configuration {
  dataPath: string;
  botToken: string;
  exchangeApiToken: string;
  openWeatherMapApiToken: string;
  googleMapsApiToken: string;
  n2yoApiToken: string;
  inlineQuerySourceChatId: string;
  mainMemeTemplateChatSessionPath: string;
  apiPort: number;
  sentryDSN: string;
  environment: "development" | "production";
}

export interface ConfigurationContext {
  configuration: Configuration;
}
