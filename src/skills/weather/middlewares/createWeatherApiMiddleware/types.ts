import { QueryForecastFunction } from "../../httpClients/queryForecast.ts";
import { QueryWeatherFunction } from "../../httpClients/queryWeather.ts";

export interface WeatherApiContext {
  weatherApi: {
    queryForecast: QueryForecastFunction;
    queryWeather: QueryWeatherFunction;
  };
}
