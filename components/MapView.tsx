'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Point } from '@/lib/geospatial-utils';
import { reverseGeocode } from '@/lib/geocoding';
import WeatherPopup from './WeatherPopup';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  selectedLocation: Point | null;
  onLocationSelect: (point: Point) => void;
  earthquakeZones: any;
  floodExtent: any;
  layerVisibility: {
    earthquakeZones: boolean;
    floodExtent: boolean;
  };
  clickMode: boolean;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function MapView({
  selectedLocation,
  onLocationSelect,
  earthquakeZones,
  floodExtent,
  layerVisibility,
  clickMode
}: MapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const clickModeRef = useRef(clickMode);

  // Update ref when clickMode changes
  useEffect(() => {
    clickModeRef.current = clickMode;
  }, [clickMode]);

  // Pakistan center coordinates
  const pakistanCenter: [number, number] = [30.3753, 69.3451];
  const defaultZoom = 6;

  // Load address when location changes
  useEffect(() => {
    if (selectedLocation) {
      setLoadingAddress(true);
      setAddress(null);
      let cancelled = false;
      
      // Add a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          setLoadingAddress(false);
        }
      }, 6000); // 6 second timeout
      
      reverseGeocode(selectedLocation).then(addr => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setAddress(addr);
          setLoadingAddress(false);
        }
      }).catch(() => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setLoadingAddress(false);
        }
      });
      
      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    } else {
      setAddress(null);
    }
  }, [selectedLocation]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (clickMode) {
      // When click mode is on, always select location
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    }
  };

  // Style functions for layers
  const getEarthquakeZoneStyle = (feature: any) => {
    const zone = feature?.properties?.PGA || '';
    const colors: Record<string, string> = {
      'Zone 1': '#4ade80', // green
      'Zone 2A': '#fbbf24', // yellow
      'Zone 2B': '#fb923c', // orange
      'Zone 3': '#f87171', // red
      'Zone 4': '#dc2626', // dark red
    };
    return {
      fillColor: colors[zone] || '#gray',
      fillOpacity: 0.3,
      color: colors[zone] || '#gray',
      weight: 2,
      opacity: 0.8
    };
  };

  const getFloodExtentStyle = () => ({
    fillColor: '#3b82f6',
    fillOpacity: 0.4,
    color: '#1e40af',
    weight: 2,
    opacity: 0.6
  });


  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={pakistanCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        whenCreated={setMap}
        eventHandlers={{
          click: handleMapClick
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Earthquake Zones Layer - if visible (render first, so flood is on top) */}
        {earthquakeZones && layerVisibility.earthquakeZones && (
          <GeoJSON
            data={earthquakeZones}
            style={getEarthquakeZoneStyle}
            onEachFeature={(feature, layer) => {
              const zone = feature?.properties?.PGA || 'Unknown';
              layer.bindPopup(`Earthquake Zone: ${zone}`);
              
              // Remove any existing click handlers
              layer.off('click');
              
              // Use ref to always get current clickMode value
              layer.on('click', (e) => {
                if (clickModeRef.current) {
                  // When click mode is ON: don't stop propagation - let map click handler work
                  // The map click will select the location
                  // Also show layer popup after a delay
                  setTimeout(() => {
                    layer.openPopup(e.latlng);
                  }, 300);
                } else {
                  // When click mode is OFF: stop propagation, only show layer popup
                  e.originalEvent.stopPropagation();
                }
              });
            }}
          />
        )}

        {/* Flood Extent Layer - if visible (render last, so it's on top) */}
        {floodExtent && layerVisibility.floodExtent && (
          <GeoJSON
            data={floodExtent}
            style={getFloodExtentStyle}
            onEachFeature={(feature, layer) => {
              layer.bindPopup('Flood Extent Area (High Risk)');
              
              // Remove any existing click handlers
              layer.off('click');
              
              // Use ref to always get current clickMode value
              layer.on('click', (e) => {
                if (clickModeRef.current) {
                  // When click mode is ON: don't stop propagation - let map click handler work
                  // The map click will select the location
                  // Also show layer popup after a delay
                  setTimeout(() => {
                    layer.openPopup(e.latlng);
                  }, 300);
                } else {
                  // When click mode is OFF: stop propagation, only show layer popup
                  e.originalEvent.stopPropagation();
                }
              });
            }}
          />
        )}

        {/* Selected Location Marker */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup maxWidth={350}>
              <div className="min-w-[300px]">
                <div className="mb-3">
                  <strong className="text-lg text-gray-900 block mb-2">📍 Selected Location</strong>
                  {loadingAddress ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Loading address...</span>
                    </div>
                  ) : address ? (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{address}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-mono">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-400">Address not available</p>
                    </div>
                  )}
                </div>
                <div className="border-t pt-3">
                  <WeatherPopup location={selectedLocation} />
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        <MapController center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : pakistanCenter} zoom={selectedLocation ? 12 : defaultZoom} />
      </MapContainer>
    </div>
  );
}

