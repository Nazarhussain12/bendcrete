'use client';

import { useEffect, useState } from 'react';
import { Cloud, Droplet, Wind, Gauge, Eye, Thermometer, Sun } from 'lucide-react';
import { Point } from '@/lib/geospatial-utils';
import { getCurrentWeather, getWeatherForecast, WeatherData, ForecastData } from '@/lib/weather';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ConstructionWeatherImpact from './ConstructionWeatherImpact';

interface WeatherDisplayProps {
  location: Point | null;
}

export default function WeatherDisplay({ location }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setWeather(null);
      setForecast(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch both current weather and forecast
    Promise.all([
      getCurrentWeather(location),
      getWeatherForecast(location)
    ]).then(([current, forecastData]) => {
      setWeather(current);
      setForecast(forecastData);
      setLoading(false);
      if (!current) {
        setError('Unable to fetch weather data');
      }
    }).catch((err) => {
      console.error('Weather fetch error:', err);
      setError('Error loading weather data');
      setLoading(false);
    });
  }, [location]);

  if (!location) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
        Select a location to see weather data
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading weather data...</p>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-yellow-800 font-semibold mb-2">⚠️ Weather Data Unavailable</div>
        <div className="text-yellow-700 text-sm">
          {error || 'Unable to fetch weather data. This may be due to:'}
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Invalid or expired API key</li>
            <li>API key not activated on OpenWeather website</li>
            <li>Network connectivity issues</li>
            <li>API rate limit exceeded</li>
          </ul>
          <p className="mt-2 text-xs">
            Please verify your OpenWeather API key at{' '}
            <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="underline">
              openweathermap.org/api
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const temperatureChartData = forecast?.map(f => ({
    date: f.date.split(',')[0], // Just the day name
    temp: f.temperature,
    min: f.minTemp,
    max: f.maxTemp
  })) || [];

  const humidityChartData = forecast?.map(f => ({
    date: f.date.split(',')[0],
    humidity: f.humidity
  })) || [];

  const windChartData = forecast?.map(f => ({
    date: f.date.split(',')[0],
    windSpeed: typeof f.windSpeed === 'string' ? parseFloat(f.windSpeed) : f.windSpeed
  })) || [];

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Weather Information</h2>
        <p className="text-sm text-gray-500 mt-1">{weather.location}</p>
      </div>

      {/* Current Weather Card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img 
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              className="w-16 h-16"
            />
            <div>
              <div className="text-3xl font-bold text-gray-900">{weather.temperature}°C</div>
              <div className="text-sm text-gray-600 capitalize">{weather.description}</div>
              <div className="text-xs text-gray-500">Feels like {weather.feelsLike}°C</div>
            </div>
          </div>
        </div>

        {/* Weather Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Humidity</div>
              <div className="text-sm font-semibold">{weather.humidity}%</div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <Wind className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Wind Speed</div>
              <div className="text-sm font-semibold">{weather.windSpeed} km/h</div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Pressure</div>
              <div className="text-sm font-semibold">{weather.pressure} hPa</div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Visibility</div>
              <div className="text-sm font-semibold">{weather.visibility} km</div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Cloud Cover</div>
              <div className="text-sm font-semibold">{weather.cloudCover}%</div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-2 flex items-center gap-2">
            <Sun className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Wind Dir</div>
              <div className="text-sm font-semibold">{weather.windDirection}°</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast Temperature Chart */}
      {forecast && forecast.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">5-Day Temperature Forecast</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={temperatureChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                label={{ value: '°C', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="max" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Max Temp"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="temp" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Temperature"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="min" 
                stroke="#60a5fa" 
                strokeWidth={2}
                name="Min Temp"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Humidity Chart */}
      {forecast && forecast.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Humidity Forecast</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={humidityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                label={{ value: '%', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="humidity" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Wind Speed Chart */}
      {forecast && forecast.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Wind Speed Forecast</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={windChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                label={{ value: 'km/h', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="windSpeed" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Forecast List */}
      {forecast && forecast.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">5-Day Forecast</h3>
          <div className="space-y-2">
            {forecast.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                    alt={day.description}
                    className="w-10 h-10"
                  />
                  <div>
                    <div className="font-medium text-sm">{day.date}</div>
                    <div className="text-xs text-gray-600 capitalize">{day.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{day.temperature}°C</div>
                  <div className="text-xs text-gray-500">
                    {day.minTemp}° / {day.maxTemp}°
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Construction Weather Impact Analysis */}
      <ConstructionWeatherImpact 
        currentWeather={weather} 
        forecast={forecast} 
      />
    </div>
  );
}

