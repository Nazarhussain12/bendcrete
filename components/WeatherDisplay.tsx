'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Point } from '@/lib/geospatial-utils';
import { getCurrentWeather, getWeatherForecast, WeatherData, ForecastData } from '@/lib/weather';

interface WeatherDisplayProps {
  location: Point | null;
  onOpenModal: (weather: WeatherData, forecast: ForecastData[] | null, locationName: string) => void;
}

export default function WeatherDisplay({ location, onOpenModal }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('');

  useEffect(() => {
    if (!location) {
      setWeather(null);
      setForecast(null);
      setLocationName('');
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
      if (current) {
        setLocationName(current.location || 'Location');
      }
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

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 shadow-md">
      <button
        onClick={() => onOpenModal(weather, forecast, locationName)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <ExternalLink className="w-5 h-5" />
        <span>View Today's Working Conditions</span>
      </button>
    </div>
  );
}

