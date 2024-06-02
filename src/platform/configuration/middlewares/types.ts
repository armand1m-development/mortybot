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
}

export interface ConfigurationContext {
  configuration: Configuration;
}
