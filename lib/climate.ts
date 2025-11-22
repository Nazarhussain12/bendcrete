import { Point } from './geospatial-utils';

/**
 * Climate data interface - represents long-term climate averages
 * This is different from weather (current conditions) - climate is historical averages
 */
export interface ClimateData {
  latitude: number;
  longitude: number;
  elevation: number;
  // Temperature averages (in Celsius)
  temperature2mMean: number; // Mean temperature at 2m
  temperature2mMax: number; // Maximum temperature at 2m
  temperature2mMin: number; // Minimum temperature at 2m
  // Precipitation
  precipitationSum: number; // Total precipitation (mm)
  // Wind
  windspeed10mMean: number; // Mean wind speed at 10m (km/h)
  // Other climate indicators
  relativehumidity2mMean: number; // Mean relative humidity at 2m (%)
  // Climate classification
  climateZone?: string; // Optional climate zone classification
}

/**
 * Fetch climate data (historical averages) from Open-Meteo Climate API
 * Open-Meteo is free, open-source, and doesn't require an API key
 * 
 * @param point - Latitude and longitude coordinates
 * @returns Climate data with long-term averages or null if unavailable
 */
export async function getClimateData(point: Point): Promise<ClimateData | null> {
  try {
    // Smart sampling: Get January (winter) and July (summer) from multiple representative years
    // This gives us seasonal representation across multiple years with minimal data
    // Sampling years: 1995, 2000, 2005, 2010, 2015, 2020 (6 years, 2 months each = 12 months total)
    // Total: ~372 days instead of 10,950 days (97% reduction, but with multi-year representation)
    const sampleYears = [1995, 2000, 2005, 2010, 2015, 2020];
    const allTemperatureMean: number[] = [];
    const allTemperatureMax: number[] = [];
    const allTemperatureMin: number[] = [];
    const allPrecipitation: number[] = [];
    const allWindSpeed: number[] = [];
    let elevation = 0;

    // Fetch data for January (winter) and July (summer) from each sample year
    const fetchPromises = sampleYears.flatMap(year => [
      // January (winter)
      fetch(`https://climate-api.open-meteo.com/v1/climate?latitude=${point.lat}&longitude=${point.lng}&start_date=${year}-01-01&end_date=${year}-01-31&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_mean&timezone=auto`),
      // July (summer)
      fetch(`https://climate-api.open-meteo.com/v1/climate?latitude=${point.lat}&longitude=${point.lng}&start_date=${year}-07-01&end_date=${year}-07-31&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_mean&timezone=auto`)
    ]);

    const responses = await Promise.all(fetchPromises);
    
    // Process all responses
    for (const response of responses) {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Climate API partial error:', errorData.reason || errorData.error);
        continue; // Skip failed requests, continue with successful ones
      }

      const data = await response.json();
      
      if (data.error || !data.daily || !data.daily.time || data.daily.time.length === 0) {
        continue; // Skip invalid responses
      }

      // Store elevation from first successful response
      if (elevation === 0 && data.elevation) {
        elevation = data.elevation;
      }

      const dailyData = data.daily;
      
      // Collect all valid values
      if (dailyData.temperature_2m_mean) {
        allTemperatureMean.push(...dailyData.temperature_2m_mean.filter((v: number) => v != null && !isNaN(v) && isFinite(v)));
      }
      if (dailyData.temperature_2m_max) {
        allTemperatureMax.push(...dailyData.temperature_2m_max.filter((v: number) => v != null && !isNaN(v) && isFinite(v)));
      }
      if (dailyData.temperature_2m_min) {
        allTemperatureMin.push(...dailyData.temperature_2m_min.filter((v: number) => v != null && !isNaN(v) && isFinite(v)));
      }
      if (dailyData.precipitation_sum) {
        allPrecipitation.push(...dailyData.precipitation_sum.filter((v: number) => v != null && !isNaN(v) && isFinite(v)));
      }
      if (dailyData.windspeed_10m_mean) {
        allWindSpeed.push(...dailyData.windspeed_10m_mean.filter((v: number) => v != null && !isNaN(v) && isFinite(v)));
      }
    }

    // Check if we got any data
    if (allTemperatureMean.length === 0) {
      console.warn('No climate data available for this location');
      return null;
    }

    // Calculate averages from all collected data
    const calculateAverage = (arr: number[]): number => {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    };

    const temperature2mMean = calculateAverage(allTemperatureMean);
    const temperature2mMax = calculateAverage(allTemperatureMax);
    const temperature2mMin = calculateAverage(allTemperatureMin);
    const precipitationSum = calculateAverage(allPrecipitation);
    const windspeed10mMean = calculateAverage(allWindSpeed);
    
    // Note: relativehumidity_2m_mean is not available in climate API
    const relativehumidity2mMean = 0;

    // Determine climate zone based on temperature and precipitation
    const climateZone = classifyClimateZone(temperature2mMean, precipitationSum);

    return {
      latitude: point.lat,
      longitude: point.lng,
      elevation: elevation,
      temperature2mMean: Math.round(temperature2mMean * 10) / 10,
      temperature2mMax: Math.round(temperature2mMax * 10) / 10,
      temperature2mMin: Math.round(temperature2mMin * 10) / 10,
      precipitationSum: Math.round(precipitationSum * 10) / 10,
      windspeed10mMean: Math.round(windspeed10mMean * 10) / 10,
      relativehumidity2mMean: relativehumidity2mMean,
      climateZone
    };
  } catch (error) {
    console.error('Error fetching climate data:', error);
    return null;
  }
}

/**
 * Classify climate zone based on temperature and precipitation
 * Simplified Köppen-Geiger classification
 */
function classifyClimateZone(meanTemp: number, precipitation: number): string {
  if (meanTemp < 0) {
    return 'Polar';
  } else if (meanTemp < 10) {
    if (precipitation < 50) {
      return 'Cold Desert';
    }
    return 'Cold';
  } else if (meanTemp < 18) {
    if (precipitation < 50) {
      return 'Temperate Desert';
    } else if (precipitation < 200) {
      return 'Temperate Semi-Arid';
    }
    return 'Temperate';
  } else if (meanTemp < 25) {
    if (precipitation < 50) {
      return 'Hot Desert';
    } else if (precipitation < 200) {
      return 'Hot Semi-Arid';
    } else if (precipitation < 1000) {
      return 'Tropical Savanna';
    }
    return 'Tropical';
  } else {
    if (precipitation < 50) {
      return 'Hot Desert';
    } else if (precipitation < 200) {
      return 'Hot Semi-Arid';
    } else if (precipitation < 1000) {
      return 'Tropical Savanna';
    }
    return 'Tropical';
  }
}

/**
 * Get climate-based cost multiplier for construction
 * Uses long-term climate averages instead of current weather
 */
export function getClimateCostMultiplier(climate: ClimateData | null): number {
  if (!climate) return 1.0;

  let multiplier = 1.0;

  // Temperature extremes add costs
  if (climate.temperature2mMax > 40) {
    multiplier += 0.08; // 8% for very hot climates
  } else if (climate.temperature2mMax > 35) {
    multiplier += 0.05; // 5% for hot climates
  } else if (climate.temperature2mMin < -10) {
    multiplier += 0.08; // 8% for very cold climates
  } else if (climate.temperature2mMin < 0) {
    multiplier += 0.05; // 5% for cold climates
  }

  // High precipitation adds costs for waterproofing and drainage
  if (climate.precipitationSum > 200) {
    multiplier += 0.06; // 6% for high precipitation areas
  } else if (climate.precipitationSum > 100) {
    multiplier += 0.03; // 3% for moderate precipitation
  }

  // High humidity adds costs for moisture protection
  // Note: relativehumidity2mMean may be 0 if not available from API
  if (climate.relativehumidity2mMean > 0) {
    if (climate.relativehumidity2mMean > 80) {
      multiplier += 0.04; // 4% for high humidity
    } else if (climate.relativehumidity2mMean > 70) {
      multiplier += 0.02; // 2% for moderate humidity
    }
  }

  // High wind speeds add costs for wind-resistant construction
  if (climate.windspeed10mMean > 25) {
    multiplier += 0.05; // 5% for high wind areas
  } else if (climate.windspeed10mMean > 15) {
    multiplier += 0.02; // 2% for moderate wind
  }

  return multiplier;
}

