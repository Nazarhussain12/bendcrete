'use client';

import { AlertTriangle, CheckCircle, Cloud, Wind, Droplet, Thermometer, Sun, Snowflake, Eye } from 'lucide-react';
import { WeatherData, ForecastData } from '@/lib/weather';

interface ConstructionWeatherImpactProps {
  currentWeather: WeatherData | null;
  forecast: ForecastData[] | null;
}

export default function ConstructionWeatherImpact({ currentWeather, forecast }: ConstructionWeatherImpactProps) {
  if (!currentWeather) {
    return null;
  }

  // Analyze construction impact
  const getTemperatureImpact = (temp: number) => {
    if (temp < 5) {
      return {
        level: 'high',
        message: 'Very Cold - Concrete work should be avoided. Risk of freezing.',
        recommendations: [
          'Use heated enclosures for concrete work',
          'Add accelerators to concrete mix',
          'Protect materials from freezing',
          'Consider postponing concrete pours'
        ],
        icon: <Snowflake className="w-5 h-5 text-blue-600" />
      };
    } else if (temp < 10) {
      return {
        level: 'medium',
        message: 'Cold - Concrete work requires special precautions.',
        recommendations: [
          'Use insulated blankets for concrete curing',
          'Monitor concrete temperature closely',
          'Consider using hot water in mix',
          'Protect workers from cold exposure'
        ],
        icon: <Cloud className="w-5 h-5 text-blue-500" />
      };
    } else if (temp >= 10 && temp <= 30) {
      return {
        level: 'low',
        message: 'Ideal Temperature - Optimal conditions for construction work.',
        recommendations: [
          'Normal concrete work can proceed',
          'Standard curing procedures apply',
          'Good working conditions for labor'
        ],
        icon: <Sun className="w-5 h-5 text-green-600" />
      };
    } else if (temp > 30 && temp <= 35) {
      return {
        level: 'medium',
        message: 'Hot - Extra precautions needed for concrete and workers.',
        recommendations: [
          'Increase water content in concrete mix',
          'Use sunshades and windbreaks',
          'Provide frequent breaks for workers',
          'Monitor concrete temperature during placement'
        ],
        icon: <Thermometer className="w-5 h-5 text-orange-600" />
      };
    } else {
      return {
        level: 'high',
        message: 'Very Hot - Construction work should be limited or postponed.',
        recommendations: [
          'Avoid concrete work during peak heat hours',
          'Work early morning or evening only',
          'Use cooling measures for concrete',
          'Ensure adequate hydration for workers',
          'Consider postponing non-critical work'
        ],
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />
      };
    }
  };

  const getWindImpact = (windSpeed: number) => {
    if (windSpeed < 20) {
      return {
        level: 'low',
        message: 'Low Wind - Safe for most construction activities.',
        recommendations: [
          'Crane operations can proceed normally',
          'No special precautions needed',
          'Good conditions for hoisting materials'
        ]
      };
    } else if (windSpeed >= 20 && windSpeed < 40) {
      return {
        level: 'medium',
        message: 'Moderate Wind - Exercise caution with elevated work.',
        recommendations: [
          'Limit crane operations',
          'Secure all loose materials',
          'Use wind barriers for concrete work',
          'Monitor conditions closely'
        ]
      };
    } else if (windSpeed >= 40 && windSpeed < 60) {
      return {
        level: 'high',
        message: 'High Wind - Dangerous for elevated work and cranes.',
        recommendations: [
          'Stop crane operations',
          'Secure all equipment and materials',
          'Avoid working at heights',
          'Postpone concrete pours if possible'
        ]
      };
    } else {
      return {
        level: 'critical',
        message: 'Very High Wind - All outdoor construction should stop.',
        recommendations: [
          'Stop all construction activities',
          'Secure site completely',
          'Evacuate elevated work areas',
          'Wait for conditions to improve'
        ]
      };
    }
  };

  const getHumidityImpact = (humidity: number) => {
    if (humidity < 30) {
      return {
        level: 'medium',
        message: 'Low Humidity - Concrete may dry too quickly.',
        recommendations: [
          'Increase curing frequency',
          'Use curing compounds or wet coverings',
          'Monitor concrete for cracking',
          'Consider fogging or misting'
        ]
      };
    } else if (humidity >= 30 && humidity <= 70) {
      return {
        level: 'low',
        message: 'Normal Humidity - Good conditions for concrete curing.',
        recommendations: [
          'Standard curing procedures apply',
          'Normal concrete work can proceed'
        ]
      };
    } else {
      return {
        level: 'medium',
        message: 'High Humidity - May slow concrete curing.',
        recommendations: [
          'Allow extra time for concrete to set',
          'Ensure proper ventilation',
          'Monitor for moisture-related issues',
          'Protect materials from moisture'
        ]
      };
    }
  };

  const getVisibilityImpact = (visibility: number) => {
    if (visibility < 1) {
      return {
        level: 'critical',
        message: 'Very Poor Visibility - Construction should stop.',
        recommendations: [
          'Stop all construction activities',
          'Use warning lights and barriers',
          'Ensure site safety measures are in place'
        ]
      };
    } else if (visibility < 5) {
      return {
        level: 'high',
        message: 'Poor Visibility - Exercise extreme caution.',
        recommendations: [
          'Limit heavy equipment operations',
          'Increase safety personnel',
          'Use additional lighting',
          'Slow down all operations'
        ]
      };
    } else {
      return {
        level: 'low',
        message: 'Good Visibility - Normal operations can proceed.',
        recommendations: [
          'Standard safety procedures apply',
          'Normal construction activities'
        ]
      };
    }
  };

  const tempImpact = getTemperatureImpact(currentWeather.temperature);
  const windImpact = getWindImpact(currentWeather.windSpeed);
  const humidityImpact = getHumidityImpact(currentWeather.humidity);
  const visibilityImpact = getVisibilityImpact(currentWeather.visibility);

  // Check forecast for upcoming issues
  const upcomingIssues: string[] = [];
  if (forecast) {
    forecast.slice(0, 3).forEach((day, index) => {
      const dayTemp = day.temperature;
      if (dayTemp < 5 || dayTemp > 35) {
        upcomingIssues.push(`${day.date}: Extreme temperature (${dayTemp}°C)`);
      }
      const dayWind = typeof day.windSpeed === 'string' ? parseFloat(day.windSpeed) : day.windSpeed;
      if (dayWind >= 40) {
        upcomingIssues.push(`${day.date}: High wind (${dayWind} km/h)`);
      }
    });
  }

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-300 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-300 text-yellow-900';
      case 'low':
        return 'bg-green-50 border-green-300 text-green-900';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-900';
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <Cloud className="w-5 h-5" />;
      case 'low':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Construction Weather Impact</h2>
        <p className="text-sm text-gray-500 mt-1">How current weather affects construction activities</p>
      </div>

      {/* Overall Assessment */}
      <div className={`border-2 rounded-lg p-4 ${getImpactColor(
        tempImpact.level === 'critical' || windImpact.level === 'critical' ? 'critical' :
        tempImpact.level === 'high' || windImpact.level === 'high' ? 'high' :
        tempImpact.level === 'medium' || windImpact.level === 'medium' ? 'medium' : 'low'
      )}`}>
        <div className="flex items-center gap-3 mb-2">
          {getImpactIcon(
            tempImpact.level === 'critical' || windImpact.level === 'critical' ? 'critical' :
            tempImpact.level === 'high' || windImpact.level === 'high' ? 'high' :
            tempImpact.level === 'medium' || windImpact.level === 'medium' ? 'medium' : 'low'
          )}
          <h3 className="font-bold text-lg">Overall Construction Suitability</h3>
        </div>
        <p className="font-medium mb-3">
          {tempImpact.level === 'critical' || windImpact.level === 'critical' 
            ? '⚠️ Construction activities should be stopped or severely limited'
            : tempImpact.level === 'high' || windImpact.level === 'high'
            ? '⚠️ Exercise extreme caution - many activities should be postponed'
            : tempImpact.level === 'medium' || windImpact.level === 'medium'
            ? '⚠️ Proceed with caution - special precautions required'
            : '✓ Good conditions for construction work'}
        </p>
      </div>

      {/* Temperature Impact */}
      <div className={`border-2 rounded-lg p-4 ${getImpactColor(tempImpact.level)}`}>
        <div className="flex items-center gap-3 mb-2">
          {tempImpact.icon}
          <h3 className="font-semibold">Temperature Impact ({currentWeather.temperature}°C)</h3>
        </div>
        <p className="mb-3 font-medium">{tempImpact.message}</p>
        <div>
          <p className="text-sm font-semibold mb-2">Recommendations:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {tempImpact.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Wind Impact */}
      <div className={`border-2 rounded-lg p-4 ${getImpactColor(windImpact.level)}`}>
        <div className="flex items-center gap-3 mb-2">
          <Wind className="w-5 h-5" />
          <h3 className="font-semibold">Wind Impact ({currentWeather.windSpeed} km/h)</h3>
        </div>
        <p className="mb-3 font-medium">{windImpact.message}</p>
        <div>
          <p className="text-sm font-semibold mb-2">Recommendations:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {windImpact.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Humidity Impact */}
      <div className={`border-2 rounded-lg p-4 ${getImpactColor(humidityImpact.level)}`}>
        <div className="flex items-center gap-3 mb-2">
          <Droplet className="w-5 h-5" />
          <h3 className="font-semibold">Humidity Impact ({currentWeather.humidity}%)</h3>
        </div>
        <p className="mb-3 font-medium">{humidityImpact.message}</p>
        <div>
          <p className="text-sm font-semibold mb-2">Recommendations:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {humidityImpact.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Visibility Impact */}
      {visibilityImpact.level !== 'low' && (
        <div className={`border-2 rounded-lg p-4 ${getImpactColor(visibilityImpact.level)}`}>
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5" />
            <h3 className="font-semibold">Visibility Impact ({currentWeather.visibility} km)</h3>
          </div>
          <p className="mb-3 font-medium">{visibilityImpact.message}</p>
          <div>
            <p className="text-sm font-semibold mb-2">Recommendations:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {visibilityImpact.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Upcoming Weather Warnings */}
      {upcomingIssues.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Upcoming Weather Warnings</h3>
          </div>
          <p className="text-sm text-orange-800 mb-2">Plan ahead for these conditions:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
            {upcomingIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Construction Activity Recommendations */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Recommended Activities for Today</h3>
        <div className="space-y-2 text-sm">
          {tempImpact.level === 'low' && windImpact.level === 'low' ? (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span className="text-blue-800">✓ Concrete pouring and finishing</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span className="text-blue-800">✓ Excavation and earthwork</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span className="text-blue-800">✓ Crane operations and material hoisting</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span className="text-blue-800">✓ Steel erection and welding</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <span className="text-blue-800">⚠ Review weather conditions before starting work</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <span className="text-blue-800">⚠ Consider indoor work or material preparation</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <span className="text-blue-800">⚠ Postpone critical outdoor activities if possible</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

