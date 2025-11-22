'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle, AlertCircle, Info, Snowflake, Droplet, Building2, Calculator, Wrench, Cone, ArrowLeft, Maximize2, Minimize2, Cloud, Wind, Gauge, Eye, Thermometer, Sun } from 'lucide-react';
import { Point, FloodRisk, EarthquakeZoneResult } from '@/lib/geospatial-utils';
import { getZoneInfo } from '@/lib/earthquake-zones-info';
import { ElevationData } from '@/lib/elevation';
import { WeatherData, ForecastData } from '@/lib/weather';
import { getWeatherForecast } from '@/lib/weather';
import ConstructionWeatherImpact from './ConstructionWeatherImpact';
import ConstructionCost from './ConstructionCost';

// Helper functions moved outside component to prevent recreation on every render
const getFloodRiskColor = (level: string) => {
  switch (level) {
    case 'Safe':
      return 'bg-green-100 border-green-300 text-green-800';
    case 'Medium Risk':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'High Risk':
      return 'bg-red-100 border-red-300 text-red-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const getFloodRiskIcon = (level: string) => {
  switch (level) {
    case 'Safe':
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    case 'Medium Risk':
      return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    case 'High Risk':
      return <AlertTriangle className="w-6 h-6 text-red-600" />;
    default:
      return <Info className="w-6 h-6 text-gray-600" />;
  }
};

const getEarthquakeRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'Low':
      return 'bg-green-100 border-green-300 text-green-800';
    case 'Moderate':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'High':
      return 'bg-orange-100 border-orange-300 text-orange-800';
    case 'Very High':
      return 'bg-red-100 border-red-300 text-red-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const getEarthquakeRiskIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case 'Low':
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    case 'Moderate':
      return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    case 'High':
    case 'Very High':
      return <AlertTriangle className="w-6 h-6 text-red-600" />;
    default:
      return <Info className="w-6 h-6 text-gray-600" />;
  }
};

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Point | null;
  address: string | null;
  floodRisk: FloodRisk | null;
  earthquakeZone: EarthquakeZoneResult | null;
  elevation: ElevationData | null;
  weather: WeatherData | null;
  onOpenWeatherModal?: () => void;
}

export default function AssessmentModal({
  isOpen,
  onClose,
  location,
  address,
  floodRisk,
  earthquakeZone,
  elevation,
  weather
}: AssessmentModalProps) {
  const [currentView, setCurrentView] = useState<'assessment' | 'newConstruction' | 'costCalculator' | 'repairRetrofitting' | 'workingConditions'>('assessment');
  const [selectedConstructionType, setSelectedConstructionType] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Memoize expensive calculations
  const zoneInfo = useMemo(() => {
    return earthquakeZone ? getZoneInfo(earthquakeZone.zone) : null;
  }, [earthquakeZone]);

  const tempCategory = useMemo(() => {
    if (!weather) return { label: 'N/A', color: 'bg-gray-100 border-gray-300 text-gray-800', icon: <Info className="w-6 h-6 text-gray-600" /> };
    const temp = weather.temperature;
    if (temp > 40) {
      return { label: 'Extreme Heat', color: 'bg-red-100 border-red-300 text-red-800', icon: <Droplet className="w-6 h-6 text-red-600" /> };
    } else if (temp < 0) {
      return { label: 'Extreme Winter', color: 'bg-blue-100 border-blue-300 text-blue-800', icon: <Snowflake className="w-6 h-6 text-blue-600" /> };
    } else if (temp < 10) {
      return { label: 'Cold', color: 'bg-blue-100 border-blue-300 text-blue-800', icon: <Snowflake className="w-6 h-6 text-blue-600" /> };
    } else if (temp > 30) {
      return { label: 'Hot', color: 'bg-orange-100 border-orange-300 text-orange-800', icon: <Droplet className="w-6 h-6 text-orange-600" /> };
    }
    return { label: 'Moderate', color: 'bg-green-100 border-green-300 text-green-800', icon: <CheckCircle className="w-6 h-6 text-green-600" /> };
  }, [weather]);

  const overallRisk = useMemo(() => {
    if (!floodRisk || !zoneInfo) return null;
    const isHighRisk = floodRisk.level === 'High Risk' || zoneInfo.riskLevel === 'Very High' || zoneInfo.riskLevel === 'High';
    return isHighRisk;
  }, [floodRisk, zoneInfo]);

  // Memoize callback functions
  const handleConstructionToolClick = useCallback((view: 'newConstruction' | 'costCalculator' | 'repairRetrofitting' | 'workingConditions') => {
    setCurrentView(view);
  }, []);

  const handleBackToAssessment = useCallback(() => {
    setSelectedConstructionType(null);
    setCurrentView('assessment');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isMaximized 
          ? 'w-full h-full' 
          : 'w-full h-full md:w-[85%] md:h-[85%] md:max-w-6xl md:rounded-lg'
      }`}>
        {/* Header */}
        <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
              {currentView === 'assessment' ? (
                <img src="/risk-assesment-icons/title-icons.svg" alt="Title Icon" className="w-5 h-5" />
              ) : currentView === 'newConstruction' ? (
                <img src="/risk-assesment-icons/new-construction-icon.svg" alt="New Construction" className="w-5 h-5" />
              ) : currentView === 'costCalculator' ? (
                <img src="/risk-assesment-icons/cost-calculator.svg" alt="Cost Calculator" className="w-5 h-5" />
              ) : currentView === 'repairRetrofitting' ? (
                <img src="/risk-assesment-icons/repair.svg" alt="Repair" className="w-5 h-5" />
              ) : (
                <img src="/risk-assesment-icons/todays-working-condition.svg" alt="Working Conditions" className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold">SITE HAZARDS ASSESSMENTS</h2>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentView === 'newConstruction' ? (
            <NewConstructionView 
              selectedConstructionType={selectedConstructionType}
              onConstructionTypeSelect={setSelectedConstructionType}
              onBack={handleBackToAssessment}
            />
          ) : currentView === 'costCalculator' ? (
            <div>
              <button
                onClick={() => setCurrentView('assessment')}
                className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Assessment</span>
              </button>
              <ConstructionCost
                location={location}
                floodRisk={floodRisk}
                earthquakeZone={earthquakeZone}
                elevation={elevation}
                weather={weather}
                baseCost={2000}
              />
            </div>
          ) : currentView === 'repairRetrofitting' ? (
            <div>
              <button
                onClick={() => setCurrentView('assessment')}
                className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Assessment</span>
              </button>
              <div className="text-center py-12">
                <p className="text-gray-600">Repair & Retrofitting - Coming Soon</p>
              </div>
            </div>
          ) : currentView === 'workingConditions' ? (
            <WorkingConditionsView 
              weather={weather}
              location={location}
              address={address}
              onBack={() => setCurrentView('assessment')}
            />
          ) : (
            <AssessmentView
              location={location}
              address={address}
              floodRisk={floodRisk}
              earthquakeZone={earthquakeZone}
              zoneInfo={zoneInfo}
              elevation={elevation}
              weather={weather}
              tempCategory={tempCategory}
              overallRisk={overallRisk}
              onConstructionToolClick={handleConstructionToolClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// New Construction View Component
function NewConstructionView({ 
  selectedConstructionType, 
  onConstructionTypeSelect,
  onBack 
}: { 
  selectedConstructionType: string | null;
  onConstructionTypeSelect: (type: string) => void;
  onBack: () => void;
}) {
  // If a construction type is selected, show detailed view
  if (selectedConstructionType) {
    return <ConstructionTypeDetailView type={selectedConstructionType} onBack={onBack} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          Built in Compliance With Current Building Regulations
        </h3>
        <p className="text-base text-gray-600">
          The step-by-step construction follow the National and international building codes.
        </p>
      </div>

      {/* Building Codes References */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Building Codes References</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* BCP 2021 */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="aspect-[3/4] rounded-lg mb-4 overflow-hidden">
              <img 
                src="/new-construction-1.jpg" 
                alt="Building Code of Pakistan BCP 2021"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold text-gray-800 text-center">Building Code of Pakistan BCP 2021</p>
          </div>

          {/* ACI 318-19 */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="aspect-[3/4] rounded-lg mb-4 overflow-hidden">
              <img 
                src="/new-construction-2.png" 
                alt="ACI 318-19 Building Code Requirements"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold text-gray-800 text-center">ACI 318-19 Building Code Requirements</p>
          </div>

          {/* ASCE 7-16 */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="aspect-[3/4] rounded-lg mb-4 overflow-hidden">
              <img 
                src="/new-construction-3.png" 
                alt="ASCE 7-16 Minimum Design Loads"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold text-gray-800 text-center">ASCE 7-16 Minimum Design Loads</p>
          </div>
        </div>
      </div>

      {/* Construction Types */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Construction Types</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RCC Construction */}
          <div 
            onClick={() => onConstructionTypeSelect('rcc')}
            className="bg-blue-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="relative h-40 md:h-56 overflow-hidden">
              <img 
                src="/RCC.png" 
                alt="RCC Construction"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-blue-700 text-white">
              <h5 className="text-base font-bold">RCC Construction</h5>
            </div>
          </div>

          {/* Brick Masonry Construction */}
          <div 
            onClick={() => onConstructionTypeSelect('brick')}
            className="bg-blue-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="relative h-40 md:h-56 overflow-hidden">
              <img 
                src="/Brick-masonry.png" 
                alt="Brick Masonry Construction"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-blue-700 text-white">
              <h5 className="text-base font-bold">Brick Masonry Const.</h5>
            </div>
          </div>

          {/* Timber Construction */}
          <div 
            onClick={() => onConstructionTypeSelect('timber')}
            className="bg-blue-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="relative h-40 md:h-56 overflow-hidden">
              <img 
                src="/timber.png" 
                alt="Timber Construction"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-blue-700 text-white">
              <h5 className="text-base font-bold">Timber Construction</h5>
            </div>
          </div>

          {/* Stone Masonry Construction */}
          <div 
            onClick={() => onConstructionTypeSelect('stone')}
            className="bg-blue-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="relative h-40 md:h-56 overflow-hidden">
              <img 
                src="/stone-masonry.png" 
                alt="Stone Masonry Construction"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-blue-700 text-white">
              <h5 className="text-base font-bold">Stone Masonry Const.</h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Construction Type Detail View Component
function ConstructionTypeDetailView({ type, onBack }: { type: string; onBack: () => void }) {
  const constructionTypes = {
    rcc: {
      title: 'RCC Construction',
      image: '/RCC.png',
      description: 'Reinforced Cement Concrete (RCC) construction is a composite material made of concrete and steel reinforcement.'
    },
    brick: {
      title: 'Brick Masonry Construction',
      image: '/Brick-masonry.png',
      description: 'Brick masonry construction uses bricks and mortar to create durable and fire-resistant structures.'
    },
    timber: {
      title: 'Timber Construction',
      image: '/timber.png',
      description: 'Timber construction utilizes wood as the primary structural material, offering sustainability and natural aesthetics.'
    },
    stone: {
      title: 'Stone Masonry Construction',
      image: '/stone-masonry.png',
      description: 'Stone masonry construction uses natural stone blocks bonded with mortar to create strong, durable structures.'
    }
  };

  const constructionType = constructionTypes[type as keyof typeof constructionTypes];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Construction Types</span>
      </button>

      {/* Construction Type Header */}
      <div className="bg-blue-700 rounded-lg overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4 md:p-6">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{constructionType.title}</h3>
          </div>
          <div className="w-full md:w-80 h-48 md:h-64 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={constructionType.image} 
              alt={constructionType.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Step-by-Step Construction Procedure */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
        <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Step-by-Step Construction Procedure</h4>
        <div className="text-gray-600">
          <p className="mb-4">The</p>
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            
          </div>
        </div>
      </div>
    </div>
  );
}

// Working Conditions View Component
function WorkingConditionsView({ 
  weather, 
  location, 
  address,
  onBack 
}: { 
  weather: WeatherData | null;
  location: Point | null;
  address: string | null;
  onBack: () => void;
}) {
  const [forecast, setForecast] = useState<ForecastData[] | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  useEffect(() => {
    if (location && !forecast) {
      setLoadingForecast(true);
      getWeatherForecast(location)
        .then((data) => {
          setForecast(data);
          setLoadingForecast(false);
        })
        .catch((error) => {
          console.error('Error fetching forecast:', error);
          setLoadingForecast(false);
        });
    }
  }, [location, forecast]);

  if (!weather) {
    return (
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Assessment</span>
        </button>
        <div className="text-center py-12">
          <p className="text-gray-600">Weather data not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Assessment</span>
      </button>

      {/* Weather Information Header */}
      <div className="mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-1">Weather Information</h3>
        <p className="text-base md:text-lg text-gray-600">{address || weather.location || 'Location'}</p>
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
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 mb-4">
          <h3 className="text-base md:text-lg font-semibold mb-3 text-gray-900">5-Day Forecast</h3>
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

      {/* Construction Weather Impact */}
      <ConstructionWeatherImpact 
        currentWeather={weather} 
        forecast={forecast} 
      />
    </div>
  );
}

// Assessment View Component (extracted from main component)
function AssessmentView({
  location,
  address,
  floodRisk,
  earthquakeZone,
  zoneInfo,
  elevation,
  weather,
  tempCategory,
  overallRisk,
  onConstructionToolClick,
  onOpenWeatherModal
}: {
  location: Point | null;
  address: string | null;
  floodRisk: FloodRisk | null;
  earthquakeZone: EarthquakeZoneResult | null;
  zoneInfo: any;
  elevation: ElevationData | null;
  weather: WeatherData | null;
  tempCategory: any;
  overallRisk: boolean | null;
  onConstructionToolClick: (view: 'newConstruction' | 'costCalculator' | 'repairRetrofitting' | 'workingConditions') => void;
}) {

  return (
    <>
          {/* Location Info */}
          {location && (
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                {address || 'Location'}
              </h3>
              <div className="text-xs md:text-sm text-gray-600 space-y-0.5">
                <p className="font-mono">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                {elevation && (
                  <p>Elevation: {elevation.elevation.toFixed(0)} m ({((elevation.elevation * 3.28084)).toFixed(0)} ft)</p>
                )}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
            {/* Flood Risk */}
            <div className={`${getFloodRiskColor(floodRisk?.level || 'Safe')} border-2 rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3`}>
              {getFloodRiskIcon(floodRisk?.level || 'Safe')}
              <div>
                <p className="font-semibold text-xs md:text-sm">Flood Risk:</p>
                <p className="font-bold text-sm md:text-base">{floodRisk?.level || 'Unknown'}</p>
              </div>
            </div>

            {/* Earthquake Zone */}
            <div className={`${getEarthquakeRiskColor(zoneInfo?.riskLevel || 'Unknown')} border-2 rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3`}>
              {getEarthquakeRiskIcon(zoneInfo?.riskLevel || 'Unknown')}
              <div>
                <p className="font-semibold text-xs md:text-sm">Earthquake Zone:</p>
                <p className="font-bold text-sm md:text-base">{earthquakeZone?.zone || 'Unknown'}</p>
              </div>
            </div>

            {/* Temperature */}
            <div className={`${tempCategory.color} border-2 rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3`}>
              {tempCategory.icon}
              <div>
                <p className="font-semibold text-xs md:text-sm">Temp:</p>
                <p className="font-bold text-sm md:text-base">{tempCategory.label}</p>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 md:p-4 mb-4 flex items-start gap-2 md:gap-3">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 font-medium text-xs md:text-sm">
              For Resilient Construction please follow the step-by-step construction procedure and resilient construction practices advised on this platform.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-4 md:my-5"></div>

          {/* Construction Tools */}
          <div className="mb-4">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <img 
                src="/risk-assesment-icons/construction-tool-heading-icon.svg" 
                alt="Construction Tools"
                className="w-7 h-7 md:w-8 md:h-8"
              />
              <h3 className="text-lg md:text-xl font-bold text-gray-900">CONSTRUCTION TOOLS</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* New Construction */}
              <button 
                onClick={() => onConstructionToolClick('newConstruction')}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg p-3 md:p-4 flex flex-col items-center gap-2 md:gap-3 transition-colors shadow-lg"
              >
                <img 
                  src="/risk-assesment-icons/new-construction-icon.svg" 
                  alt="New Construction"
                  className="w-7 h-7 md:w-9 md:h-9"
                />
                <span className="font-semibold text-xs md:text-sm text-center">New Construction</span>
              </button>

              {/* Cost Calculator */}
              <button 
                onClick={() => onConstructionToolClick('costCalculator')}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg p-3 md:p-4 flex flex-col items-center gap-2 md:gap-3 transition-colors shadow-lg"
              >
                <img 
                  src="/risk-assesment-icons/cost-calculator.svg" 
                  alt="Cost Calculator"
                  className="w-7 h-7 md:w-9 md:h-9"
                />
                <span className="font-semibold text-xs md:text-sm text-center">Cost Calculator</span>
              </button>

              {/* Repair & Retrofitting */}
              <button 
                onClick={() => onConstructionToolClick('repairRetrofitting')}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg p-3 md:p-4 flex flex-col items-center gap-2 md:gap-3 transition-colors shadow-lg"
              >
                <img 
                  src="/risk-assesment-icons/repair.svg" 
                  alt="Repair & Retrofitting"
                  className="w-7 h-7 md:w-9 md:h-9"
                />
                <span className="font-semibold text-xs md:text-sm text-center">Repair & Retrofitting</span>
              </button>

              {/* Today's Working Conditions */}
              <button 
                onClick={() => onConstructionToolClick('workingConditions')}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg p-3 md:p-4 flex flex-col items-center gap-2 md:gap-3 transition-colors shadow-lg"
              >
                <img 
                  src="/risk-assesment-icons/todays-working-condition.svg" 
                  alt="Today's Working Conditions"
                  className="w-7 h-7 md:w-9 md:h-9"
                />
                <span className="font-semibold text-xs md:text-sm text-center">Today's Working Conditions</span>
              </button>
            </div>
          </div>
    </>
  );
}

