export interface QueryWeatherResponse {
  coord: Coordinates;
  weather: WeatherDescription[];
  base: string;
  main: MainStats;
  visibility: number;
  wind: WindStats;
  clouds: CloudStats;
  dt: number;
  sys: SunStats;
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface Coordinates {
  lon: number;
  lat: number;
}

export interface WeatherDescription {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface MainStats {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
}

export interface WindStats {
  speed: number;
  deg: number;
}

export interface CloudStats {
  all: number;
}

export interface SunStats {
  type: number;
  id: number;
  country: string;
  sunrise: number;
  sunset: number;
}
