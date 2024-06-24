import type { QueryForecastFunction } from "../../httpClients/queryForecast.ts";
import type { QueryWeatherFunction } from "../../httpClients/queryWeather.ts";

export interface WeatherApiContext {
  weatherApi: {
    queryForecast: QueryForecastFunction;
    queryWeather: QueryWeatherFunction;
  };
}
