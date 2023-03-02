export interface Configuration {
  dataPath: string;
  botToken: string;
  exchangeApiToken: string;
  openWeatherMapApiToken: string;
  googleMapsApiToken: string;
}

export interface ConfigurationContext {
  configuration: Configuration;
}
