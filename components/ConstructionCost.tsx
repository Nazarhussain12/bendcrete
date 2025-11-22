'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Point, FloodRisk, EarthquakeZoneResult } from '@/lib/geospatial-utils';
import { getZoneInfo } from '@/lib/earthquake-zones-info';
import { ElevationData } from '@/lib/elevation';
import { getCurrentWeather, WeatherData } from '@/lib/weather';
import { getClimateData, ClimateData, getClimateCostMultiplier } from '@/lib/climate';

interface ConstructionCostProps {
  location: Point | null;
  floodRisk: FloodRisk | null;
  earthquakeZone: EarthquakeZoneResult | null;
  elevation: ElevationData | null;
  baseCost: number; // Base construction cost per square foot
  weather?: WeatherData | null; // Optional: if provided, won't fetch weather
}

export default function ConstructionCost({ location, floodRisk, earthquakeZone, elevation, baseCost = 2000, weather: providedWeather }: ConstructionCostProps) {
  const [weather, setWeather] = useState<WeatherData | null>(providedWeather || null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [climate, setClimate] = useState<ClimateData | null>(null);
  const [loadingClimate, setLoadingClimate] = useState(false);

  // Fetch weather data when location changes (only if not provided as prop)
  useEffect(() => {
    if (providedWeather !== undefined) {
      setWeather(providedWeather);
      return;
    }

    if (!location) {
      setWeather(null);
      return;
    }

    setLoadingWeather(true);
    getCurrentWeather(location)
      .then((weatherData) => {
        setWeather(weatherData);
        setLoadingWeather(false);
      })
      .catch((error) => {
        console.error('Error fetching weather for cost calculation:', error);
        setWeather(null);
        setLoadingWeather(false);
      });
  }, [location, providedWeather]);

  // Fetch climate data (long-term averages) when location changes
  useEffect(() => {
    if (!location) {
      setClimate(null);
      return;
    }

    setLoadingClimate(true);
    getClimateData(location)
      .then((climateData) => {
        setClimate(climateData);
        setLoadingClimate(false);
      })
      .catch((error) => {
        console.error('Error fetching climate data:', error);
        setClimate(null);
        setLoadingClimate(false);
      });
  }, [location]);

  if (!location) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        <p>Select a location to see construction cost estimates</p>
      </div>
    );
  }

  const zoneInfo = earthquakeZone ? getZoneInfo(earthquakeZone.zone) : null;
  
  // Calculate cost multipliers
  const earthquakeMultiplier = zoneInfo?.costMultiplier || 1.0;
  const floodMultiplier = floodRisk?.level === 'High Risk' ? 1.3 : floodRisk?.level === 'Medium Risk' ? 1.15 : 1.0;
  
  // Elevation multiplier: Higher elevation = more cost (access, materials transport)
  // Very high elevation (>2000m) adds 10-20% cost, moderate (500-2000m) adds 5-10%
  let elevationMultiplier = 1.0;
  if (elevation) {
    if (elevation.elevation > 2000) {
      elevationMultiplier = 1.15; // 15% increase for very high elevation
    } else if (elevation.elevation > 1000) {
      elevationMultiplier = 1.10; // 10% increase for high elevation
    } else if (elevation.elevation > 500) {
      elevationMultiplier = 1.05; // 5% increase for moderate elevation
    }
  }
  
  // Climate multiplier: Use long-term climate averages instead of current weather
  // This provides more stable and representative cost estimates
  const climateMultiplier = getClimateCostMultiplier(climate);
  
  // Fallback to weather multiplier if climate data is not available
  let weatherMultiplier = 1.0;
  if (!climate && weather) {
    // High humidity (>80%) adds 3% for moisture protection
    if (weather.humidity > 80) {
      weatherMultiplier += 0.03;
    }
    // Extreme temperatures add costs
    if (weather.temperature > 40 || weather.temperature < 0) {
      weatherMultiplier += 0.05; // 5% for extreme temperatures
    }
    // High wind speeds (>30 km/h average) add costs for wind-resistant construction
    if (typeof weather.windSpeed === 'number' && weather.windSpeed > 30) {
      weatherMultiplier += 0.04; // 4% for high wind areas
    }
    // High precipitation risk (if humidity is very high and temperature is moderate)
    if (weather.humidity > 85 && weather.temperature > 15 && weather.temperature < 35) {
      weatherMultiplier += 0.02; // 2% for high precipitation risk
    }
  }
  
  // Use climate multiplier if available, otherwise use weather multiplier
  const environmentalMultiplier = climate ? climateMultiplier : weatherMultiplier;
  
  const totalMultiplier = earthquakeMultiplier * floodMultiplier * elevationMultiplier * environmentalMultiplier;
  
  // Cost breakdown
  const baseCostPerSqft = baseCost;
  const earthquakeCost = baseCostPerSqft * (earthquakeMultiplier - 1);
  const floodCost = baseCostPerSqft * (floodMultiplier - 1);
  const elevationCost = baseCostPerSqft * (elevationMultiplier - 1);
  const environmentalCost = baseCostPerSqft * (environmentalMultiplier - 1);
  const adjustedCostPerSqft = baseCostPerSqft * totalMultiplier;
  
  // Example for 1000 sqft house
  const houseSize = 1000;
  const totalCost = adjustedCostPerSqft * houseSize;
  const baseTotalCost = baseCostPerSqft * houseSize;
  const additionalCost = totalCost - baseTotalCost;

  // Chart data
  const costBreakdown = [
    { name: 'Base Construction', value: baseTotalCost, color: '#3b82f6' },
    { name: 'Earthquake Mitigation', value: earthquakeCost * houseSize, color: '#f59e0b' },
    { name: 'Flood Protection', value: floodCost * houseSize, color: '#10b981' },
    { name: 'Elevation Factors', value: elevationCost * houseSize, color: '#8b5cf6' },
    { name: climate ? 'Climate Adaptation' : 'Weather Adaptation', value: environmentalCost * houseSize, color: '#ec4899' }
  ].filter(item => item.value > 0);

  const multiplierData = [
    { factor: 'Base Cost', multiplier: 1.0, cost: baseCostPerSqft },
    { 
      factor: 'Earthquake Zone', 
      multiplier: earthquakeMultiplier, 
      cost: baseCostPerSqft * earthquakeMultiplier
    },
    { 
      factor: 'Flood Risk', 
      multiplier: floodMultiplier, 
      cost: baseCostPerSqft * earthquakeMultiplier * floodMultiplier
    },
    { 
      factor: 'Elevation', 
      multiplier: elevationMultiplier, 
      cost: baseCostPerSqft * earthquakeMultiplier * floodMultiplier * elevationMultiplier
    },
    { 
      factor: climate ? 'Climate' : 'Weather', 
      multiplier: environmentalMultiplier, 
      cost: baseCostPerSqft * totalMultiplier
    },
  ];

  const pieData = costBreakdown.map(item => ({
    name: item.name,
    value: Math.round(item.value)
  }));

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#ef4444'];

  return (
    <div className="space-y-3 md:space-y-4">
      <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Construction Cost Estimation</h2>
      
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 gap-2 md:gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm text-blue-600 font-medium mb-1">Base Cost (per sqft)</p>
          <p className="text-xl md:text-2xl font-bold text-blue-900">Rs. {baseCostPerSqft.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm text-orange-600 font-medium mb-1">Adjusted Cost (per sqft)</p>
          <p className="text-xl md:text-2xl font-bold text-orange-900">Rs. {adjustedCostPerSqft.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm text-green-600 font-medium mb-1">Total (1000 sqft house)</p>
          <p className="text-xl md:text-2xl font-bold text-green-900">Rs. {totalCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Additional Cost Info */}
      {additionalCost > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Additional Cost:</strong> Rs. {additionalCost.toLocaleString()} for risk mitigation measures
            ({((totalMultiplier - 1) * 100).toFixed(1)}% increase)
          </p>
        </div>
      )}

      {/* Cost Breakdown Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-2">Cost Breakdown (1000 sqft)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={costBreakdown} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10 }}
              width={50}
            />
            <Tooltip 
              formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Distribution Pie Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-2">Cost Distribution</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Factors Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-2">Cost Factors</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1.5">Factor</th>
                <th className="text-right p-1.5">Multiplier</th>
                <th className="text-right p-1.5">Cost/sqft</th>
              </tr>
            </thead>
            <tbody>
              {multiplierData.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-1.5 text-gray-700">{row.factor}</td>
                  <td className="text-right p-1.5">{row.multiplier.toFixed(2)}x</td>
                  <td className="text-right p-1.5">Rs. {row.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Elevation & Climate/Weather Info */}
      {(elevation || climate || weather) && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <h3 className="text-xs font-semibold mb-2 text-purple-700">Site Conditions:</h3>
          <div className="space-y-1 text-xs text-purple-600">
            {elevation && (
              <p>📍 Elevation: {elevation.elevation.toFixed(0)} m 
                {elevationMultiplier > 1.0 && ` (${((elevationMultiplier - 1) * 100).toFixed(0)}% cost increase)`}
              </p>
            )}
            {loadingClimate && (
              <p>🌍 Loading climate data...</p>
            )}
            {climate && (
              <div className="space-y-1">
                <p className="font-semibold">🌍 Climate (Long-term Averages):</p>
                <p>Temp: {climate.temperature2mMean.toFixed(1)}°C (Max: {climate.temperature2mMax.toFixed(1)}°C, Min: {climate.temperature2mMin.toFixed(1)}°C)</p>
                <p>Precipitation: {climate.precipitationSum.toFixed(1)} mm/day | Humidity: {climate.relativehumidity2mMean.toFixed(0)}% | Wind: {climate.windspeed10mMean.toFixed(1)} km/h</p>
                <p className="text-purple-700">Zone: {climate.climateZone}</p>
                {environmentalMultiplier > 1.0 && (
                  <p className="text-purple-700 font-medium">
                    Climate conditions add {((environmentalMultiplier - 1) * 100).toFixed(1)}% to construction costs
                  </p>
                )}
              </div>
            )}
            {!climate && loadingWeather && (
              <p>🌤️ Loading weather data...</p>
            )}
            {!climate && weather && (
              <div className="space-y-1">
                <p>🌤️ Current Weather: {weather.temperature}°C, {weather.humidity}% humidity, {typeof weather.windSpeed === 'number' ? weather.windSpeed.toFixed(0) : weather.windSpeed} km/h wind</p>
                {environmentalMultiplier > 1.0 && (
                  <p className="text-purple-700 font-medium">
                    Weather conditions add {((environmentalMultiplier - 1) * 100).toFixed(1)}% to construction costs
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cost Notes */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h3 className="text-xs font-semibold mb-2 text-gray-700">Notes:</h3>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>Base cost assumes standard construction</li>
          <li>Earthquake mitigation: seismic reinforcement & foundation</li>
          <li>Flood protection: elevated foundations & waterproofing</li>
          <li>Elevation factors: access, material transport, site preparation</li>
          <li>Weather adaptation: moisture protection, temperature control, wind resistance</li>
          <li>Costs may vary based on site conditions</li>
          <li>Consult professionals for accurate estimates</li>
        </ul>
      </div>
    </div>
  );
}

