'use client';

import { useEffect, useState } from 'react';
import { Point } from '@/lib/geospatial-utils';
import { getCurrentWeather, WeatherData } from '@/lib/weather';

interface WeatherPopupProps {
  location: Point;
}

export default function WeatherPopup({ location }: WeatherPopupProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentWeather(location).then(data => {
      setWeather(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [location]);

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t">
        <div className="text-xs text-gray-500">Loading weather...</div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center gap-2 mb-2">
        <img 
          src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
          alt={weather.description}
          className="w-10 h-10"
        />
        <div>
          <div className="text-lg font-bold">{weather.temperature}°C</div>
          <div className="text-xs text-gray-600 capitalize">{weather.description}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-600">Feels like:</span>
          <span className="ml-1 font-medium">{weather.feelsLike}°C</span>
        </div>
        <div>
          <span className="text-gray-600">Humidity:</span>
          <span className="ml-1 font-medium">{weather.humidity}%</span>
        </div>
        <div>
          <span className="text-gray-600">Wind:</span>
          <span className="ml-1 font-medium">{weather.windSpeed} km/h</span>
        </div>
        <div>
          <span className="text-gray-600">Pressure:</span>
          <span className="ml-1 font-medium">{weather.pressure} hPa</span>
        </div>
      </div>
    </div>
  );
}

