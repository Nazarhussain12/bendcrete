'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MapControls from '@/components/MapControls';
import MapLegend from '@/components/MapLegend';
import RiskAssessment from '@/components/RiskAssessment';
import WeatherDisplay from '@/components/WeatherDisplay';
import AssessmentModal from '@/components/AssessmentModal';
import { Point, checkFloodRisk, findEarthquakeZone } from '@/lib/geospatial-utils';
import { getElevation, ElevationData } from '@/lib/elevation';
import { getCurrentWeather, WeatherData, ForecastData } from '@/lib/weather';
import { BasemapType } from '@/components/MapView';
import * as turf from '@turf/turf';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">Loading map...</div>
});


export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<Point | null>(null);
  const [earthquakeZones, setEarthquakeZones] = useState<any>(null);
  const [floodExtent, setFloodExtent] = useState<any>(null);
  const [floodRisk, setFloodRisk] = useState<any>(null);
  const [earthquakeZone, setEarthquakeZone] = useState<any>(null);
  const [elevation, setElevation] = useState<ElevationData | null>(null);
  const [loadingElevation, setLoadingElevation] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [assessmentModalData, setAssessmentModalData] = useState<{ location: Point; address: string | null; floodRisk: any; earthquakeZone: any; elevation: ElevationData | null; weather: WeatherData | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ step: '', progress: 0 });
  const [error, setError] = useState<string | null>(null);
  const [calculatingRisk, setCalculatingRisk] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState({
    earthquakeZones: true,
    floodExtent: true
  });
  const [clickMode, setClickMode] = useState(true); // Track if click on map is enabled
  const [basemap, setBasemap] = useState<BasemapType>('osm'); // Current basemap
  const [showPanel, setShowPanel] = useState(false); // Show/hide panel on mobile (closed by default)

  // Load data files in parallel with progress tracking
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingProgress({ step: 'Loading earthquake zones...', progress: 20 });
        
        // Load both files in parallel
        const [eqResponse, floodResponse] = await Promise.all([
          fetch('/data/earthquake-zones.json'),
          fetch('/data/Flood-extent.json')
        ]);

        if (!eqResponse.ok) throw new Error('Failed to load earthquake zones');
        if (!floodResponse.ok) throw new Error('Failed to load flood extent');

        setLoadingProgress({ step: 'Parsing earthquake zones...', progress: 40 });
        const eqData = await eqResponse.json();
        setEarthquakeZones(eqData);

        setLoadingProgress({ step: 'Parsing flood extent data...', progress: 60 });
        const floodData = await floodResponse.json();
        setFloodExtent(floodData);

        setLoadingProgress({ step: 'Finalizing...', progress: 90 });

        setLoadingProgress({ step: 'Complete', progress: 100 });
        
        // Small delay to show completion
        setTimeout(() => {
          setLoading(false);
        }, 300);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);


  // Update risk assessment when location changes (with debounce for performance)
  useEffect(() => {
    if (!selectedLocation || !earthquakeZones || !floodExtent) {
      setFloodRisk(null);
      setEarthquakeZone(null);
      setCalculatingRisk(false);
      setElevation(null);
      return;
    }

    setCalculatingRisk(true);

    // Debounce the calculation to avoid excessive processing
    const timeoutId = setTimeout(() => {
      try {
        const flood = checkFloodRisk(selectedLocation, floodExtent, 5);
        const eq = findEarthquakeZone(selectedLocation, earthquakeZones);
        setFloodRisk(flood);
        setEarthquakeZone(eq);
      } catch (error) {
        console.error('Error calculating risks:', error);
      } finally {
        setCalculatingRisk(false);
      }
    }, 600); // Increased debounce to 600ms for better performance and stability

    return () => {
      clearTimeout(timeoutId);
      setCalculatingRisk(false);
    };
  }, [selectedLocation, earthquakeZones, floodExtent]);

  // Fetch elevation and weather when location changes
  useEffect(() => {
    if (!selectedLocation) {
      setElevation(null);
      setWeather(null);
      return;
    }

    setLoadingElevation(true);
    getElevation(selectedLocation)
      .then((elevationData) => {
        setElevation(elevationData);
        setLoadingElevation(false);
      })
      .catch((error) => {
        console.error('Error fetching elevation:', error);
        setElevation(null);
        setLoadingElevation(false);
      });

    setLoadingWeather(true);
    getCurrentWeather(selectedLocation)
      .then((weatherData) => {
        setWeather(weatherData);
        setLoadingWeather(false);
      })
      .catch((error) => {
        console.error('Error fetching weather:', error);
        setWeather(null);
        setLoadingWeather(false);
      });
  }, [selectedLocation]);

  const handleLocationSelect = (point: Point) => {
    setSelectedLocation(point);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      // Use high accuracy options for better location precision
      const options: PositionOptions = {
        enableHighAccuracy: true, // Use GPS if available for better accuracy
        timeout: 15000, // 15 second timeout
        maximumAge: 60000 // Accept cached position if less than 1 minute old
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy; // Accuracy in meters
          
          // Validate location is within reasonable bounds (Pakistan approximately: 23.5-37.0°N, 60.8-77.8°E)
          // Allow some margin for edge cases
          const isWithinPakistanBounds = 
            lat >= 23.0 && lat <= 38.0 && 
            lng >= 60.0 && lng <= 78.5;
          
          if (isWithinPakistanBounds) {
            setSelectedLocation({
              lat: lat,
              lng: lng
            });
            
            // Show accuracy info if accuracy is poor (>1000m)
            if (accuracy > 1000) {
              console.warn(`Location accuracy is ${Math.round(accuracy)}m - may not be precise`);
            }
          } else {
            // Location seems to be outside Pakistan - ask user to confirm
            const confirm = window.confirm(
              `Detected location: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n` +
              `This appears to be outside Pakistan. Accuracy: ${Math.round(accuracy)}m\n\n` +
              `Do you want to use this location anyway?`
            );
            if (confirm) {
              setSelectedLocation({
                lat: lat,
                lng: lng
              });
            } else {
              alert('Please select your location manually on the map or try again.');
            }
          }
        },
        (error) => {
          let errorMessage = 'Unable to get your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location access was denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable. Please try again or select manually.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again or select manually.';
              break;
            default:
              errorMessage += 'An unknown error occurred. Please select your location manually.';
              break;
          }
          alert(errorMessage);
          console.error('Geolocation error:', error);
        },
        options
      );
    } else {
      alert('Geolocation is not supported by your browser. Please select your location manually on the map.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium mb-2">{loadingProgress.step}</p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{loadingProgress.progress}%</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 font-semibold">Error: {error}</p>
          <p className="text-sm text-red-500 mt-2">Please ensure data files are in the public/data directory</p>
        </div>
      </div>
    );
  }

  const handleLayerToggle = (layer: 'earthquakeZones' | 'floodExtent') => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50">
      {/* Left Panel - All content in one scrollable area */}
      {/* Mobile: Overlay panel that slides in. Desktop: Fixed width sidebar */}
      <div className={`${showPanel ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-[9999] md:z-auto w-80 md:w-96 bg-white shadow-xl md:shadow-lg h-screen flex-shrink-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        {/* Header */}
        <div className="flex-shrink-0 p-3 md:p-4 border-b bg-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <img 
                src="/logo.png" 
                alt="NDMA Logo" 
                className="h-12 w-12 md:h-16 md:w-16 object-contain flex-shrink-0"
              />
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">NDMA</h1>
                <p className="text-xs md:text-sm text-gray-700 mt-0.5 md:mt-1 font-medium">Resilient Construction Platform</p>
              </div>
            </div>
            {/* Mobile: Close panel button */}
            <button
              onClick={() => setShowPanel(false)}
              className="md:hidden p-2 hover:bg-blue-700 rounded transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6">
          {/* Risk Assessment */}
          <RiskAssessment
            location={selectedLocation}
            floodRisk={floodRisk}
            earthquakeZone={earthquakeZone}
            elevation={elevation}
            loadingElevation={loadingElevation}
            calculating={calculatingRisk}
            weather={weather}
            onOpenModal={() => {}}
          />
          
       

          {/* Footer */}
          <div className="border-t pt-6 pb-4">
            <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600 text-center">
              <p>NDMA Resilient Construction Platform - Pakistan Construction Assessment</p>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        {selectedLocation && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 md:p-4 shadow-lg">
            <button
              onClick={() => {
                const address = null; // Address will be fetched in modal if needed
                setAssessmentModalData({ 
                  location: selectedLocation, 
                  address: address, 
                  floodRisk: floodRisk, 
                  earthquakeZone: earthquakeZone, 
                  elevation: elevation, 
                  weather: weather 
                });
                setAssessmentModalOpen(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View Full Site Assessment</span>
            </button>
          </div>
        )}
      </div>

      {/* Full Screen Map */}
      <div className="flex-1 relative">
        <MapView
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          earthquakeZones={earthquakeZones}
          floodExtent={floodExtent}
          layerVisibility={layerVisibility}
          clickMode={clickMode}
          basemap={basemap}
        />
        
        {/* Map Controls Overlay */}
        <MapControls
          onLocationSelect={handleLocationSelect}
          onCurrentLocation={handleCurrentLocation}
          layerVisibility={layerVisibility}
          onLayerToggle={handleLayerToggle}
          clickMode={clickMode}
          onClickModeToggle={setClickMode}
          basemap={basemap}
          onBasemapChange={setBasemap}
        />

        {/* Map Legend Overlay */}
        <MapLegend />

        {/* Click Instruction - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 text-sm">
          <p className="text-gray-700 font-medium">
            {clickMode ? '📍 Click on map to assess location' : '📍 Click layers to view information'}
          </p>
        </div>

        {/* Mobile: Panel toggle button - Fixed position in top-right, always visible when panel is closed */}
        {!showPanel && (
          <button
            onClick={() => setShowPanel(true)}
            className="md:hidden fixed top-4 right-4 z-[10000] bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-3 transition-all duration-200 flex items-center justify-center"
            aria-label="Show panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Mobile: Backdrop overlay when panel is open */}
        {showPanel && (
          <div
            onClick={() => setShowPanel(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-[9998]"
            aria-label="Close panel"
          />
        )}

      </div>

      {/* Assessment Modal - Rendered outside side panel, full screen */}
      {assessmentModalData && (
        <AssessmentModal
          isOpen={assessmentModalOpen}
          onClose={() => {
            setAssessmentModalOpen(false);
            setAssessmentModalData(null);
          }}
          location={assessmentModalData.location}
          address={assessmentModalData.address}
          floodRisk={assessmentModalData.floodRisk}
          earthquakeZone={assessmentModalData.earthquakeZone}
          elevation={assessmentModalData.elevation}
          weather={assessmentModalData.weather}
        />
      )}
    </div>
  );
}
