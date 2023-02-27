export interface QueryForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: List[];
  city: CityStats;
}

export interface List {
  dt: number;
  main: MainStats;
  weather: WeatherDescription[];
  clouds: CloudStats;
  wind: WindStats;
  visibility: number;
  pop: number;
  sys: Sys;
  dt_txt: string;
}

export interface MainStats {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  sea_level: number;
  grnd_level: number;
  humidity: number;
  temp_kf: number;
}

export interface WeatherDescription {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CloudStats {
  all: number;
}

export interface WindStats {
  speed: number;
  deg: number;
  gust: number;
}

export interface Sys {
  pod: string;
}

export interface CityStats {
  id: number;
  name: string;
  coord: Coordinates;
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

export interface Coordinates {
  lat: number;
  lon: number;
}
