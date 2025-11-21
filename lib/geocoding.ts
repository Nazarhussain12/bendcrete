import { Point } from './geospatial-utils';

// Simple cache to avoid repeated API calls for the same location
const geocodeCache = new Map<string, { address: string | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Create a cache key from coordinates (rounded to 4 decimal places for caching)
 */
function getCacheKey(point: Point): string {
  return `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 3000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try Photon API (Komoot) - Open-source, no key needed, fast
 */
async function tryPhoton(point: Point): Promise<string | null> {
  try {
    const url = `https://photon.komoot.io/reverse?lat=${point.lat}&lon=${point.lng}&lang=en`;
    const response = await fetchWithTimeout(url, {}, 3000);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      if (props) {
        // Build a well-formatted address from Photon API response
        const parts: string[] = [];
        
        // Street/Road name
        if (props.name && (props.type === 'street' || props.type === 'road' || props.osm_key === 'highway')) {
          parts.push(props.name);
        }
        
        // Locality/Neighborhood
        if (props.locality) {
          parts.push(props.locality);
        }
        
        // City/Town
        if (props.city) {
          parts.push(props.city);
        } else if (props.town) {
          parts.push(props.town);
        } else if (props.village) {
          parts.push(props.village);
        }
        
        // County/District
        if (props.county) {
          parts.push(props.county);
        }
        
        // State/Province
        if (props.state) {
          parts.push(props.state);
        }
        
        // Country
        if (props.country) {
          parts.push(props.country);
        }
        
        // If we have a name but it's not a street, add it at the beginning
        if (props.name && props.type !== 'street' && props.type !== 'road' && props.osm_key !== 'highway') {
          parts.unshift(props.name);
        }
        
        return parts.length > 0 ? parts.join(', ') : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try BigDataCloud API - Free, no key needed, good coverage
 */
async function tryBigDataCloud(point: Point): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${point.lat}&longitude=${point.lng}&localityLanguage=en`;
    const response = await fetchWithTimeout(url, {}, 3000);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data) {
      const parts: string[] = [];
      if (data.locality) parts.push(data.locality);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      if (data.countryName) parts.push(data.countryName);
      
      return parts.length > 0 ? parts.join(', ') : data.display_name || data.locality || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try OpenStreetMap Nominatim (fallback)
 */
async function tryNominatim(point: Point): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}&zoom=18&addressdetails=1`;
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'BendcreteApp/1.0',
          'Accept': 'application/json'
        }
      },
      3000
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      const parts: string[] = [];
      
      if (addr.road) parts.push(addr.road);
      if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
      if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
      if (addr.state_district) parts.push(addr.state_district);
      if (addr.state) parts.push(addr.state);
      if (addr.country) parts.push(addr.country);
      
      return parts.length > 0 ? parts.join(', ') : data.display_name || null;
    }
    
    return data.display_name || null;
  } catch {
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address
 * Tries multiple APIs as fallbacks for better reliability
 */
export async function reverseGeocode(point: Point): Promise<string | null> {
  // Check cache first
  const cacheKey = getCacheKey(point);
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.address;
  }

  // Try APIs in order of preference (fastest/most reliable first)
  let address: string | null = null;

  // Try Photon first (fast, no key needed)
  address = await tryPhoton(point);
  if (address) {
    geocodeCache.set(cacheKey, { address, timestamp: Date.now() });
    return address;
  }

  // Try BigDataCloud second (good coverage)
  address = await tryBigDataCloud(point);
  if (address) {
    geocodeCache.set(cacheKey, { address, timestamp: Date.now() });
    return address;
  }

  // Try Nominatim as last resort
  address = await tryNominatim(point);
  if (address) {
    geocodeCache.set(cacheKey, { address, timestamp: Date.now() });
    return address;
  }

  // Cache null result for a shorter duration on error (1 minute)
  geocodeCache.set(cacheKey, { address: null, timestamp: Date.now() - (CACHE_DURATION - 60000) });
  
  return null;
}

