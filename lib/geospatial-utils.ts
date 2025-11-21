import * as turf from '@turf/turf';

export interface Point {
  lat: number;
  lng: number;
}

export interface FloodRisk {
  level: 'Safe' | 'Medium Risk' | 'High Risk';
  distance: number; // distance in km
  inFloodExtent: boolean;
  inBuffer: boolean;
}

export interface EarthquakeZoneResult {
  zone: string;
  pga: string;
}

/**
 * Check if a point is inside a polygon (using Turf.js point-in-polygon)
 * Handles both Polygon and MultiPolygon geometries
 */
export function isPointInPolygon(point: Point, geometry: any): boolean {
  if (!geometry || !geometry.coordinates) {
    return false;
  }

  try {
    const pt = turf.point([point.lng, point.lat]);
    
    // Handle different geometry types
    if (geometry.type === 'Polygon') {
      const poly = turf.polygon(geometry.coordinates);
      return turf.booleanPointInPolygon(pt, poly);
    } else if (geometry.type === 'MultiPolygon') {
      // For MultiPolygon, check each polygon
      // MultiPolygon coordinates structure: [[[[lng, lat], ...]]]
      // Each element in geometry.coordinates is a polygon: [[[lng, lat], ...]]
      for (const polygonCoords of geometry.coordinates) {
        try {
          const poly = turf.polygon(polygonCoords);
          if (turf.booleanPointInPolygon(pt, poly)) {
            return true;
          }
        } catch (polyError) {
          // If one polygon fails, try the next one
          continue;
        }
      }
      return false;
    } else {
      // Try to create a feature and check
      try {
        const feature = turf.feature(geometry);
        return turf.booleanPointInPolygon(pt, feature);
      } catch (featError) {
        return false;
      }
    }
  } catch (error) {
    // Silently return false on error
    return false;
  }
}

/**
 * Calculate distance between two points in kilometers
 */
export function calculateDistance(point1: Point, point2: Point): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check flood risk for a location (optimized)
 */
export function checkFloodRisk(
  point: Point,
  floodExtent: any,
  bufferRadiusKm: number = 5
): FloodRisk {
  // Check if point is in flood extent
  let inFloodExtent = false;
  let minDistance = Infinity;

  if (floodExtent && floodExtent.features) {
    // Optimize: Check inside first, then distance only if needed
    // Limit to first 20 features for performance
    const maxFeaturesToCheck = Math.min(20, floodExtent.features.length);
    
    for (let i = 0; i < maxFeaturesToCheck; i++) {
      const feature = floodExtent.features[i];
      if (feature.geometry && feature.geometry.coordinates) {
        try {
          const isInside = isPointInPolygon(point, feature.geometry);
          if (isInside) {
            inFloodExtent = true;
            minDistance = 0;
            break; // Early exit if inside
          }
        } catch (error) {
          // Skip this feature if there's an error
          continue;
        }
      }
    }

    // Only calculate distance if not inside and we need to check buffer
    // Limit to first 5 features for distance calculation (very expensive)
    if (!inFloodExtent) {
      const featuresToCheck = floodExtent.features.slice(0, Math.min(5, floodExtent.features.length));
      
      for (const feature of featuresToCheck) {
        if (feature.geometry && feature.geometry.coordinates) {
          try {
            const distance = calculateDistanceToFeature(point, feature);
            if (distance < minDistance) {
              minDistance = distance;
              // Early exit if we're already within buffer
              if (minDistance <= bufferRadiusKm) {
                break;
              }
            }
          } catch (error) {
            // Skip this feature if there's an error
            continue;
          }
        }
      }
    }
  }

  const inBuffer = !inFloodExtent && minDistance <= bufferRadiusKm;

  let level: 'Safe' | 'Medium Risk' | 'High Risk';
  if (inFloodExtent) {
    level = 'High Risk';
  } else if (inBuffer) {
    level = 'Medium Risk';
  } else {
    level = 'Safe';
  }

  return {
    level,
    distance: minDistance === Infinity ? 999 : minDistance,
    inFloodExtent,
    inBuffer
  };
}

/**
 * Calculate minimum distance from point to feature using Turf.js
 */
function calculateDistanceToFeature(point: Point, feature: any): number {
  if (!feature.geometry || !feature.geometry.coordinates) {
    return Infinity;
  }

  try {
    const pt = turf.point([point.lng, point.lat]);
    const geom = turf.feature(feature.geometry);
    
    // For polygons, calculate distance to boundary
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      // Get the boundary (perimeter) of the polygon
      const boundary = turf.polygonToLine(geom);
      const distance = turf.pointToLineDistance(pt, boundary, { units: 'kilometers' });
      return distance;
    } else {
      // For other geometry types, use point to line distance
      const distance = turf.pointToLineDistance(pt, geom, { units: 'kilometers' });
      return distance;
    }
  } catch (error) {
    // Fallback to simple distance calculation
    let minDist = Infinity;
    const processCoordinates = (coords: any[]) => {
      if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
        coords.forEach(coord => processCoordinates(coord));
      } else if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
        coords.forEach((coord: number[]) => {
          const dist = calculateDistance(point, { lat: coord[1], lng: coord[0] });
          if (dist < minDist) {
            minDist = dist;
          }
        });
      }
    };

    if (feature.geometry.type === 'Polygon') {
      processCoordinates(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon: any) => {
        processCoordinates(polygon);
      });
    }

    return minDist;
  }
}

/**
 * Find nearest point on flood extent boundary and return distance + nearest point
 */
export function findNearestFloodPoint(
  point: Point,
  floodExtent: any
): { distance: number; nearestPoint: Point | null; feature: any | null } {
  if (!floodExtent || !floodExtent.features) {
    return { distance: Infinity, nearestPoint: null, feature: null };
  }

  let minDistance = Infinity;
  let nearestPoint: Point | null = null;
  let nearestFeature: any | null = null;

  // Check first 10 features for performance
  const maxFeatures = Math.min(10, floodExtent.features.length);

  for (let i = 0; i < maxFeatures; i++) {
    const feature = floodExtent.features[i];
    if (!feature.geometry || !feature.geometry.coordinates) {
      continue;
    }

    try {
      const pt = turf.point([point.lng, point.lat]);
      const geom = turf.feature(feature.geometry);

      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        // Extract coordinates from polygon directly (outer ring)
        let boundaryCoords: number[][] = [];
        
        if (feature.geometry.type === 'Polygon') {
          // Polygon: [[[lng, lat], [lng, lat], ...]] - first array is outer ring
          const outerRing = feature.geometry.coordinates[0];
          if (Array.isArray(outerRing)) {
            boundaryCoords = outerRing.filter((coord: any) => 
              Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number'
            );
          }
        } else if (feature.geometry.type === 'MultiPolygon') {
          // MultiPolygon: [[[[lng, lat], ...]]] - get first polygon's outer ring
          if (Array.isArray(feature.geometry.coordinates[0]) && 
              Array.isArray(feature.geometry.coordinates[0][0])) {
            const firstPolygon = feature.geometry.coordinates[0];
            const outerRing = firstPolygon[0];
            if (Array.isArray(outerRing)) {
              boundaryCoords = outerRing.filter((coord: any) => 
                Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number'
              );
            }
          }
        }
        
        if (boundaryCoords.length === 0) {
          continue;
        }
        
        // Calculate distance to boundary by finding closest point on line segments
        let closestCoord: number[] | null = null;
        let closestDist = Infinity;
        
        // Check all line segments in the boundary (closed polygon, so last connects to first)
        for (let j = 0; j < boundaryCoords.length; j++) {
          const coord1 = boundaryCoords[j];
          const coord2 = boundaryCoords[(j + 1) % boundaryCoords.length]; // Wrap around for closed polygon
          
          if (!Array.isArray(coord1) || !Array.isArray(coord2) ||
              coord1.length < 2 || coord2.length < 2 ||
              typeof coord1[0] !== 'number' || typeof coord1[1] !== 'number' ||
              typeof coord2[0] !== 'number' || typeof coord2[1] !== 'number') {
            continue;
          }
          
          try {
            // Create line segment
            const lineSegment = turf.lineString([[coord1[0], coord1[1]], [coord2[0], coord2[1]]]);
            
            // Calculate distance to this line segment
            const dist = turf.pointToLineDistance(pt, lineSegment, { units: 'kilometers' });
            
            if (dist < closestDist) {
              // This segment is closer, so find the actual nearest point on it
              // Sample points along the segment to find the closest one
              let segmentClosestDist = Infinity;
              let segmentClosestCoord: number[] | null = null;
              
              // Sample 15 points along the segment (good balance of accuracy and performance)
              const numSamples = 15;
              for (let k = 0; k <= numSamples; k++) {
                const t = k / numSamples;
                const sampleLng = coord1[0] + t * (coord2[0] - coord1[0]);
                const sampleLat = coord1[1] + t * (coord2[1] - coord1[1]);
                
                try {
                  const samplePoint = turf.point([sampleLng, sampleLat]);
                  const sampleDist = turf.distance(pt, samplePoint, { units: 'kilometers' });
                  
                  if (sampleDist < segmentClosestDist) {
                    segmentClosestDist = sampleDist;
                    segmentClosestCoord = [sampleLng, sampleLat];
                  }
                } catch (sampleErr) {
                  continue;
                }
              }
              
              // Update if we found a closer point
              if (segmentClosestCoord && segmentClosestDist < closestDist) {
                closestDist = segmentClosestDist;
                closestCoord = segmentClosestCoord;
              } else {
                // Fallback: use the closer endpoint
                const dist1 = turf.distance(pt, turf.point([coord1[0], coord1[1]]), { units: 'kilometers' });
                const dist2 = turf.distance(pt, turf.point([coord2[0], coord2[1]]), { units: 'kilometers' });
                if (dist1 < dist2 && dist1 < closestDist) {
                  closestDist = dist1;
                  closestCoord = [coord1[0], coord1[1]];
                } else if (dist2 < closestDist) {
                  closestDist = dist2;
                  closestCoord = [coord2[0], coord2[1]];
                }
              }
            }
          } catch (err) {
            // If line segment calculation fails, check distance to endpoints
            try {
              const dist1 = turf.distance(pt, turf.point([coord1[0], coord1[1]]), { units: 'kilometers' });
              const dist2 = turf.distance(pt, turf.point([coord2[0], coord2[1]]), { units: 'kilometers' });
              const minDist = Math.min(dist1, dist2);
              
              if (minDist < closestDist) {
                closestDist = minDist;
                closestCoord = dist1 < dist2 ? [coord1[0], coord1[1]] : [coord2[0], coord2[1]];
              }
            } catch (endpointErr) {
              continue;
            }
          }
        }
        
        if (closestDist < minDistance) {
          minDistance = closestDist;
          nearestFeature = feature;
          
          // Use the closest coordinate we found
          if (closestCoord && closestCoord.length >= 2) {
            nearestPoint = {
              lat: closestCoord[1],
              lng: closestCoord[0]
            };
          }
        }
      }
    } catch (error) {
      // Skip this feature if there's an error
      console.warn('Error processing flood feature', i, error);
      continue;
    }
  }

  // If we have a distance but no nearest point, create a point at the calculated distance
  if (minDistance !== Infinity && !nearestPoint && nearestFeature) {
    // Fallback: create a point at the calculated distance in a general direction
    // This is a simplified approach - just use the first coordinate of the feature
    try {
      const feature = nearestFeature;
      if (feature.geometry && feature.geometry.coordinates) {
        // Get first coordinate from the feature
        const getFirstCoord = (coords: any): number[] | null => {
          if (Array.isArray(coords[0])) {
            if (Array.isArray(coords[0][0])) {
              return getFirstCoord(coords[0]);
            } else if (typeof coords[0][0] === 'number') {
              return coords[0];
            }
          }
          return null;
        };
        
        const firstCoord = getFirstCoord(feature.geometry.coordinates);
        if (firstCoord && firstCoord.length >= 2) {
          nearestPoint = {
            lat: firstCoord[1],
            lng: firstCoord[0]
          };
        }
      }
    } catch (err) {
      // If fallback fails, return null
    }
  }

  return {
    distance: minDistance === Infinity ? 999 : minDistance,
    nearestPoint,
    feature: nearestFeature
  };
}

/**
 * Find which earthquake zone a point belongs to
 */
export function findEarthquakeZone(
  point: Point,
  earthquakeZones: any
): EarthquakeZoneResult | null {
  if (!earthquakeZones || !earthquakeZones.features) {
    return null;
  }

  // Check all features - if point is in multiple zones, return the first match
  // (In practice, zones shouldn't overlap, but if they do, we return the first one found)
  for (const feature of earthquakeZones.features) {
    if (!feature.geometry || !feature.geometry.coordinates) {
      continue;
    }

    if (!feature.properties || !feature.properties.PGA) {
      continue;
    }

    try {
      const isInside = isPointInPolygon(point, feature.geometry);
      if (isInside) {
        return {
          zone: feature.properties.PGA,
          pga: feature.properties.PGA
        };
      }
    } catch (error) {
      // If one feature fails, continue to the next
      continue;
    }
  }

  return null;
}

