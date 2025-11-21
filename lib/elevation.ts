import { Point } from './geospatial-utils';

const OPEN_ELEVATION_API_URL = 'https://api.open-elevation.com/api/v1/lookup';

export interface ElevationData {
  latitude: number;
  longitude: number;
  elevation: number; // in meters
}

/**
 * Fetch elevation data from Open-Elevation API
 * Based on NASA SRTM (30m resolution)
 */
export async function getElevation(point: Point): Promise<ElevationData | null> {
  try {
    const url = `${OPEN_ELEVATION_API_URL}?locations=${point.lat},${point.lng}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      console.error('Elevation API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        elevation: result.elevation || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching elevation:', error);
    return null;
  }
}

