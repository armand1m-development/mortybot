export interface Configuration {
  botToken: string;
  exchangeApiToken: string;
  openWeatherMapApiToken: string;
}

export interface ConfigurationContext {
  configuration: Configuration;
}
