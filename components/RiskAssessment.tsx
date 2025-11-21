'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Point, FloodRisk, EarthquakeZoneResult } from '@/lib/geospatial-utils';
import { getZoneInfo } from '@/lib/earthquake-zones-info';
import { reverseGeocode } from '@/lib/geocoding';
import { ElevationData } from '@/lib/elevation';
import { Mountain } from 'lucide-react';

interface RiskAssessmentProps {
  location: Point | null;
  floodRisk: FloodRisk | null;
  earthquakeZone: EarthquakeZoneResult | null;
  elevation: ElevationData | null;
  loadingElevation?: boolean;
  calculating?: boolean;
}

export default function RiskAssessment({ location, floodRisk, earthquakeZone, elevation, loadingElevation = false, calculating = false }: RiskAssessmentProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    if (location) {
      setLoadingAddress(true);
      setAddress(null);
      let cancelled = false;
      
      // Add a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          setLoadingAddress(false);
        }
      }, 6000); // 6 second timeout
      
      reverseGeocode(location).then(addr => {
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
  }, [location]);

  if (!location) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>Select a location on the map to see risk assessment</p>
      </div>
    );
  }

  if (calculating) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p>Calculating risks...</p>
      </div>
    );
  }

  const zoneInfo = earthquakeZone ? getZoneInfo(earthquakeZone.zone) : null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Safe':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium Risk':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High Risk':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Very High':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Safe':
        return <CheckCircle className="w-6 h-6" />;
      case 'Medium Risk':
        return <AlertCircle className="w-6 h-6" />;
      case 'High Risk':
      case 'Very High':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <Info className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Risk Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">Click on map to analyze a location</p>
      </div>
      
      {/* Location Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Selected Location</h3>
        </div>
        {loadingAddress ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700">Loading address...</p>
          </div>
        ) : address ? (
          <div className="space-y-2">
            <p className="text-base text-blue-900 font-semibold leading-relaxed">{address}</p>
            <p className="text-xs text-blue-600 font-mono">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-blue-700 font-medium">Coordinates:</p>
            <p className="text-xs text-blue-600 font-mono">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        )}
        
        {/* Elevation Info */}
        <div className="mt-3 pt-3 border-t border-blue-300">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Elevation:</span>
            {loadingElevation ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span className="text-xs text-blue-700">Loading...</span>
              </div>
            ) : elevation ? (
              <span className="text-sm text-blue-900 font-semibold">
                {elevation.elevation.toFixed(0)} m ({((elevation.elevation * 3.28084)).toFixed(0)} ft)
              </span>
            ) : (
              <span className="text-xs text-blue-600">Not available</span>
            )}
          </div>
        </div>
      </div>

      {/* Flood Risk */}
      <div className={`border-2 rounded-lg p-4 ${getRiskColor(floodRisk?.level || 'Safe')}`}>
        <div className="flex items-center gap-3 mb-3">
          {getRiskIcon(floodRisk?.level || 'Safe')}
          <h3 className="font-bold text-lg">Flood Risk: {floodRisk?.level || 'Unknown'}</h3>
        </div>
        {floodRisk && (
          <div className="space-y-2 text-sm">
            {floodRisk.inFloodExtent ? (
              <p className="font-medium">⚠️ Location is within flood extent area</p>
            ) : floodRisk.inBuffer ? (
              <p className="font-medium">
                ⚠️ Location is within {floodRisk.distance.toFixed(2)} km of flood extent (within 5km buffer zone)
              </p>
            ) : (
              <p className="font-medium">
                ✓ Location is {floodRisk.distance.toFixed(2)} km away from flood extent (Safe zone)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Earthquake Zone Risk */}
      {earthquakeZone && zoneInfo ? (
        <div className={`border-2 rounded-lg p-4 ${getRiskColor(zoneInfo.riskLevel)}`}>
          <div className="flex items-center gap-3 mb-3">
            {getRiskIcon(zoneInfo.riskLevel)}
            <h3 className="font-bold text-lg">Earthquake Zone: {earthquakeZone.zone}</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-semibold mb-1">Risk Level: {zoneInfo.riskLevel}</p>
              <p className="text-sm opacity-90">{zoneInfo.description}</p>
            </div>
            
            <div>
              <p className="font-semibold mb-1">Conditions:</p>
              <ul className="list-disc list-inside text-sm space-y-1 opacity-90">
                {zoneInfo.conditions.map((condition, idx) => (
                  <li key={idx}>{condition}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Vulnerability:</p>
              <ul className="list-disc list-inside text-sm space-y-1 opacity-90">
                {zoneInfo.vulnerability.map((vuln, idx) => (
                  <li key={idx}>{vuln}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Construction Recommendations:</p>
              <ul className="list-disc list-inside text-sm space-y-1 opacity-90">
                {zoneInfo.constructionRecommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600">Earthquake zone information not available for this location</p>
        </div>
      )}

      {/* Overall Suitability - More Prominent */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-5 shadow-md">
        <h3 className="font-bold text-xl mb-3 text-gray-900">Overall Construction Suitability</h3>
        {floodRisk && earthquakeZone && zoneInfo ? (
          <div className="space-y-2">
            {floodRisk.level === 'High Risk' || zoneInfo.riskLevel === 'Very High' ? (
              <p className="text-red-700 font-semibold">
                ⚠️ Not Recommended: High risk location. Consider alternative sites or extensive mitigation measures.
              </p>
            ) : floodRisk.level === 'Medium Risk' || zoneInfo.riskLevel === 'High' ? (
              <p className="text-orange-700 font-semibold">
                ⚠️ Proceed with Caution: Moderate to high risk. Professional assessment and enhanced construction required.
              </p>
            ) : (
              <p className="text-green-700 font-semibold">
                ✓ Suitable: Location appears suitable for construction with standard precautions.
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Complete risk assessment data not available</p>
        )}
      </div>
    </div>
  );
}

