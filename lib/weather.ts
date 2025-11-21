import { Point } from './geospatial-utils';

const OPENWEATHER_API_KEY = 'e170a15f8e5ef9e9c5b9eb7a799d7426';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  visibility: number;
  cloudCover: number;
  uvIndex?: number;
  location: string;
}

export interface ForecastData {
  date: string;
  temperature: number;
  minTemp: number;
  maxTemp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number | string;
}

/**
 * Fetch current weather data from OpenWeather API
 */
export async function getCurrentWeather(point: Point): Promise<WeatherData | null> {
  try {
    const url = `${OPENWEATHER_BASE_URL}/weather?lat=${point.lat}&lon=${point.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenWeather API 401 Error:', {
          message: errorData.message || 'Invalid or unauthorized API key',
          note: 'Please verify your API key at https://openweathermap.org/api. New keys may take a few hours to activate.'
        });
      } else {
        console.error('Weather API error:', response.status, response.statusText);
      }
      return null;
    }

    const data = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind?.speed ? parseFloat((data.wind.speed * 3.6).toFixed(1)) : 0, // Convert m/s to km/h
      windDirection: data.wind?.deg || 0,
      description: data.weather[0]?.description || 'Unknown',
      icon: data.weather[0]?.icon || '01d',
      visibility: data.visibility ? parseFloat((data.visibility / 1000).toFixed(1)) : 0, // Convert to km
      cloudCover: data.clouds?.all || 0,
      location: data.name || 'Unknown Location'
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

/**
 * Fetch 5-day weather forecast from OpenWeather API
 */
export async function getWeatherForecast(point: Point): Promise<ForecastData[] | null> {
  try {
    const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${point.lat}&lon=${point.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenWeather Forecast API 401 Error:', {
          message: errorData.message || 'Invalid or unauthorized API key',
          note: 'Please verify your API key at https://openweathermap.org/api. New keys may take a few hours to activate.'
        });
      } else {
        console.error('Weather Forecast API error:', response.status, response.statusText);
      }
      return null;
    }

    const data = await response.json();
    
    // Group forecasts by date and get daily forecasts
    const dailyForecasts: { [key: string]: any[] } = {};
    
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = [];
      }
      dailyForecasts[date].push(item);
    });

    // Get one forecast per day (preferably midday)
    const forecasts: ForecastData[] = [];
    const dates = Object.keys(dailyForecasts).slice(0, 5); // Get next 5 days
    
    dates.forEach((date, index) => {
      const dayForecasts = dailyForecasts[date];
      // Use the midday forecast (around index 2-3 in the array)
      const selectedForecast = dayForecasts[Math.floor(dayForecasts.length / 2)] || dayForecasts[0];
      
      // Find min/max temps for the day
      const temps = dayForecasts.map((f: any) => f.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      
      forecasts.push({
        date: new Date(selectedForecast.dt * 1000).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        temperature: Math.round(selectedForecast.main.temp),
        minTemp: Math.round(minTemp),
        maxTemp: Math.round(maxTemp),
        description: selectedForecast.weather[0]?.description || 'Unknown',
        icon: selectedForecast.weather[0]?.icon || '01d',
        humidity: selectedForecast.main.humidity,
        windSpeed: selectedForecast.wind?.speed ? parseFloat((selectedForecast.wind.speed * 3.6).toFixed(1)) : 0
      });
    });

    return forecasts;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
}

