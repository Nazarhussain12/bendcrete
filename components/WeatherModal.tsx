'use client';

import { useState } from 'react';
import { X, Cloud, Droplet, Wind, Gauge, Eye, Thermometer, Sun, Cone, Maximize2, Minimize2 } from 'lucide-react';
import { WeatherData, ForecastData } from '@/lib/weather';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ConstructionWeatherImpact from './ConstructionWeatherImpact';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
  forecast: ForecastData[] | null;
  location: string;
}

export default function WeatherModal({
  isOpen,
  onClose,
  weather,
  forecast,
  location
}: WeatherModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  if (!isOpen || !weather) return null;

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isMaximized 
          ? 'w-full h-full' 
          : 'w-full h-full md:w-[85%] md:h-[85%] md:max-w-6xl md:rounded-lg'
      }`}>
        {/* Header */}
        <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
              <Cone className="w-5 h-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold">Today's Working Conditions</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              aria-label={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Weather Information Header */}
          <div className="mb-4">
            <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-1">Weather Information</h3>
            <p className="text-base md:text-lg text-gray-600">{location}</p>
          </div>

          {/* Current Weather Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4 md:p-5 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-0">
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  className="w-14 h-14 md:w-16 md:h-16"
                />
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900">{weather.temperature}°C</div>
                  <div className="text-base md:text-lg text-gray-600 capitalize">{weather.description}</div>
                  <div className="text-sm text-gray-500">Feels like {weather.feelsLike}°C</div>
                </div>
              </div>
            </div>

            {/* Weather Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              <div className="bg-white/70 rounded-lg p-2.5 md:p-3 flex items-center gap-2 shadow-sm">
                <Droplet className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-gray-600">Humidity</div>
                  <div className="text-xs md:text-sm font-semibold">{weather.humidity}%</div>
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-2.5 md:p-3 flex items-center gap-2 shadow-sm">
                <Wind className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-gray-600">Wind Speed</div>
                  <div className="text-xs md:text-sm font-semibold">{weather.windSpeed} km/h</div>
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-2.5 md:p-3 flex items-center gap-2 shadow-sm">
                <Gauge className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-gray-600">Pressure</div>
                  <div className="text-xs md:text-sm font-semibold">{weather.pressure} hPa</div>
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-2.5 md:p-3 flex items-center gap-2 shadow-sm">
                <Eye className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-gray-600">Visibility</div>
                  <div className="text-xs md:text-sm font-semibold">{weather.visibility} km</div>
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-2.5 md:p-3 flex items-center gap-2 shadow-sm">
                <Cloud className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-gray-600">Cloud Cover</div>
                  <div className="text-xs md:text-sm font-semibold">{weather.cloudCover}%</div>
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-2.5 md:p-3 flex items-center gap-2 shadow-sm">
                <Sun className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-gray-600">Wind Dir</div>
                  <div className="text-xs md:text-sm font-semibold">{weather.windDirection}°</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          {forecast && forecast.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-900">5-Day Forecast</h3>
              <div className="space-y-2">
                {forecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 md:gap-3">
                      <img 
                        src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                        alt={day.description}
                        className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-xs md:text-sm">{day.date}</div>
                        <div className="text-[10px] md:text-xs text-gray-600 capitalize truncate">{day.description}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-xs md:text-sm">{day.temperature}°C</div>
                      <div className="text-[10px] md:text-xs text-gray-500">
                        {day.minTemp}° / {day.maxTemp}°
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forecast Charts */}
          {forecast && forecast.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Temperature Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm md:text-base font-semibold mb-3 text-gray-900">5-Day Temperature Forecast</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={temperatureChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={10}
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

              {/* Humidity Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 text-gray-900">Humidity Forecast</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={humidityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={10}
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

              {/* Wind Speed Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 text-gray-900">Wind Speed Forecast</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={windChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={10}
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
            </div>
          )}

          {/* Construction Weather Impact */}
          <ConstructionWeatherImpact 
            currentWeather={weather} 
            forecast={forecast} 
          />
        </div>
      </div>
    </div>
  );
}

