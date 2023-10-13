export interface Configuration {
  dataPath: string;
  botToken: string;
  exchangeApiToken: string;
  openWeatherMapApiToken: string;
  googleMapsApiToken: string;
  n2yoApiToken: string;
}

export interface ConfigurationContext {
  configuration: Configuration;
}
