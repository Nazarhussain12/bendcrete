'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, useMapEvents } from 'react-leaflet';
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

export type BasemapType = 'osm' | 'arcgis-satellite';

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
  basemap?: BasemapType;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

// Component to handle map click events
function MapClickHandler({ 
  clickMode, 
  onLocationSelect 
}: { 
  clickMode: boolean; 
  onLocationSelect: (point: Point) => void;
}) {
  const map = useMap();
  const clickModeRef = useRef(clickMode);
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    clickModeRef.current = clickMode;
  }, [clickMode]);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (clickModeRef.current) {
        onLocationSelectRef.current({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map]);

  return null;
}

// Custom ArcGIS Tile Layer Component
// ArcGIS REST services use {z}/{y}/{x} URL format
// Testing both TMS and non-TMS approaches to find the correct one
function ArcGISTileLayer({ url, attribution }: { url: string; attribution: string }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Try WITHOUT TMS first - ArcGIS might use {z}/{y}/{x} pattern but standard coordinates
    const arcgisLayer = L.tileLayer(url, {
      attribution: attribution,
      maxZoom: 19,
      minZoom: 0,
      tileSize: 256,
      zoomOffset: 0,
      tms: false, // Try without TMS first
    });
    
    // Override getTileUrl to use ArcGIS {z}/{y}/{x} format
    // Testing: ArcGIS might use {z}/{y}/{x} URL pattern but with standard coordinates (no inversion)
    arcgisLayer.getTileUrl = function(coords: L.Coords) {
      const z = coords.z;
      const x = coords.x;
      // Try WITHOUT inversion first - ArcGIS {z}/{y}/{x} might just be URL format, not TMS
      const y = coords.y; // Use y directly without inversion
      const tileUrl = url.replace('{z}', z.toString()).replace('{y}', y.toString()).replace('{x}', x.toString());
      return tileUrl;
    };
    
    arcgisLayer.addTo(map);
    
    return () => {
      map.removeLayer(arcgisLayer);
    };
  }, [map, url, attribution]);
  
  return null;
}

export default function MapView({
  selectedLocation,
  onLocationSelect,
  earthquakeZones,
  floodExtent,
  layerVisibility,
  clickMode,
  basemap = 'osm'
}: MapViewProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const clickModeRef = useRef(clickMode);
  const onLocationSelectRef = useRef(onLocationSelect);

  // Update refs when props change (needed for GeoJSON layer click handlers)
  useEffect(() => {
    clickModeRef.current = clickMode;
  }, [clickMode]);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

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

  // Get basemap URL and attribution based on selected basemap
  // Note: Both basemaps use Web Mercator (EPSG:3857) projection, same as Leaflet default
  // Coordinates (lat/lng) work the same for both basemaps
  const getBasemapConfig = () => {
    switch (basemap) {
      case 'arcgis-satellite':
        // ArcGIS World Imagery - uses standard Web Mercator (EPSG:3857)
        // Same projection as OpenStreetMap, so coordinates work identically
        // Using custom component to handle {z}/{y}/{x} URL format correctly
        const arcgisUrl = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        return {
          url: arcgisUrl,
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
          tms: true, // Custom component handles TMS correctly
          maxZoom: 19,
          minZoom: 0
        };
      case 'osm':
      default:
        // OpenStreetMap - uses standard Web Mercator (EPSG:3857)
        // Same projection as ArcGIS, coordinates are compatible
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          tms: false,
          maxZoom: 19,
          minZoom: 0
        };
    }
  };

  const basemapConfig = getBasemapConfig();

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={pakistanCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        {basemap === 'arcgis-satellite' ? (
          <ArcGISTileLayer 
            url={basemapConfig.url}
            attribution={basemapConfig.attribution}
          />
        ) : (
          <TileLayer
            key={basemap}
            attribution={basemapConfig.attribution}
            url={basemapConfig.url}
            tms={basemapConfig.tms}
            maxZoom={basemapConfig.maxZoom}
            minZoom={basemapConfig.minZoom}
            noWrap={false}
            bounds={undefined}
            tileSize={256}
            zoomOffset={0}
            eventHandlers={{
            load: (e) => {
              // Tile layer loaded successfully
            }
            }}
          />
        )}
        
        {/* Map click handler */}
        <MapClickHandler clickMode={clickMode} onLocationSelect={onLocationSelect} />
        
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
                  // When click mode is ON: select location immediately
                  onLocationSelectRef.current({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                  });
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
                  // When click mode is ON: select location immediately
                  onLocationSelectRef.current({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                  });
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

        <MapController center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : pakistanCenter} zoom={selectedLocation ? 17
           : defaultZoom} />
      </MapContainer>
    </div>
  );
}

