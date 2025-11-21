'use client';

import { Search, MapPin, Navigation, Layers, MousePointer2 } from 'lucide-react';
import { useState } from 'react';
import { Point } from '@/lib/geospatial-utils';

interface MapControlsProps {
  onLocationSelect: (point: Point) => void;
  onCurrentLocation: () => void;
  layerVisibility: {
    earthquakeZones: boolean;
    floodExtent: boolean;
  };
  onLayerToggle: (layer: 'earthquakeZones' | 'floodExtent') => void;
  clickMode: boolean;
  onClickModeToggle: (enabled: boolean) => void;
}

export default function MapControls({
  onLocationSelect,
  onCurrentLocation,
  layerVisibility,
  onLayerToggle,
  clickMode,
  onClickModeToggle
}: MapControlsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Try Photon API first (fast, no key needed)
      let locationFound = false;
      
      // Try Photon API first (fast geocoder, no key needed)
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery + ', Pakistan')}&limit=5`;
        const photonResponse = await fetch(photonUrl, {
          signal: AbortSignal.timeout(5000)
        });
        
        if (photonResponse.ok) {
          const photonData = await photonResponse.json();
          if (photonData && photonData.features && photonData.features.length > 0) {
            // Find the best match (prefer cities, towns, or places in Pakistan)
            const feature = photonData.features.find((f: any) => 
              f.properties?.countrycode === 'PK' || 
              f.properties?.country === 'Pakistan' ||
              f.properties?.osm_value === 'city' ||
              f.properties?.osm_value === 'town' ||
              f.properties?.osm_value === 'village'
            ) || photonData.features[0];
            
            if (feature.geometry && feature.geometry.coordinates) {
              const [lng, lat] = feature.geometry.coordinates;
              onLocationSelect({
                lat: lat,
                lng: lng
              });
              setSearchQuery('');
              locationFound = true;
            }
          }
        }
      } catch (photonError) {
        console.log('Photon API failed, trying Nominatim...');
      }

      // If Photon didn't work, try Nominatim
      if (!locationFound) {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Pakistan')}&limit=1`;
        const response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'BendcreteApp/1.0'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const result = data[0];
            onLocationSelect({
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon)
            });
            setSearchQuery('');
            locationFound = true;
          }
        }
      }

      if (!locationFound) {
        alert('Location not found. Please try a different search term or be more specific (e.g., "Lahore, Pakistan" or "Karachi, Sindh").');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      {/* Location Search */}
      <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2 min-w-[300px]">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search address or location (e.g., Lahore, Karachi, Islamabad)..."
            className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {isSearching ? '...' : 'Go'}
        </button>
        <button
          onClick={onCurrentLocation}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
          title="Use current location"
        >
          <Navigation className="w-4 h-4" />
          <span className="text-xs">Current</span>
        </button>
      </div>

      {/* Click Mode Toggle */}
      <button
        onClick={() => onClickModeToggle(!clickMode)}
        className={`rounded-lg shadow-lg p-2 flex items-center gap-2 transition-colors ${
          clickMode 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title={clickMode ? 'Click mode enabled - Click on map to select location' : 'Click mode disabled - Click layers to view info'}
      >
        <MousePointer2 className="w-5 h-5" />
        <span className="text-sm font-medium">Click Map</span>
      </button>

      {/* Layer Toggle Button */}
      <button
        onClick={() => setShowLayers(!showLayers)}
        className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <Layers className="w-5 h-5 text-gray-700" />
        <span className="text-sm font-medium text-gray-700">Layers</span>
      </button>

      {/* Layer Controls Panel */}
      {showLayers && (
        <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Toggle Layers</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={layerVisibility.earthquakeZones}
                onChange={() => onLayerToggle('earthquakeZones')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Earthquake Zones</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={layerVisibility.floodExtent}
                onChange={() => onLayerToggle('floodExtent')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Flood Extent</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

