export interface EarthquakeZoneInfo {
  zone: string;
  pga: string;
  description: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  conditions: string[];
  vulnerability: string[];
  constructionRecommendations: string[];
  costMultiplier: number; // Multiplier for construction costs
}

export const earthquakeZonesInfo: Record<string, EarthquakeZoneInfo> = {
  'Zone 1': {
    zone: 'Zone 1',
    pga: '< 0.05g',
    description: 'Lowest seismic hazard zone with minimal earthquake risk',
    riskLevel: 'Low',
    conditions: [
      'Very low probability of significant ground shaking',
      'Stable geological conditions',
      'Minimal seismic activity historically',
      'Suitable for standard construction practices'
    ],
    vulnerability: [
      'Low vulnerability to earthquake damage',
      'Minimal risk of structural failure',
      'Low risk of ground liquefaction',
      'Stable foundation conditions'
    ],
    constructionRecommendations: [
      'Standard building codes sufficient',
      'No special seismic reinforcement required',
      'Standard foundation design acceptable',
      'Regular construction materials suitable'
    ],
    costMultiplier: 1.0
  },
  'Zone 2A': {
    zone: 'Zone 2A',
    pga: '0.05g - 0.10g',
    description: 'Low to moderate seismic hazard zone',
    riskLevel: 'Moderate',
    conditions: [
      'Low to moderate probability of ground shaking',
      'Generally stable geological conditions',
      'Occasional minor seismic activity',
      'Most of Punjab falls in this zone'
    ],
    vulnerability: [
      'Moderate vulnerability to earthquake damage',
      'Some risk of structural damage in strong earthquakes',
      'Low to moderate risk of ground effects',
      'Generally stable foundation conditions'
    ],
    constructionRecommendations: [
      'Follow standard seismic building codes',
      'Consider basic seismic reinforcement',
      'Ensure proper foundation design',
      'Use quality construction materials'
    ],
    costMultiplier: 1.15
  },
  'Zone 2B': {
    zone: 'Zone 2B',
    pga: '0.10g - 0.15g',
    description: 'Moderate seismic hazard zone with increased risk',
    riskLevel: 'Moderate',
    conditions: [
      'Moderate probability of significant ground shaking',
      'Some areas with active fault lines',
      'Historical moderate seismic activity',
      'Requires careful site assessment'
    ],
    vulnerability: [
      'Moderate to high vulnerability',
      'Risk of structural damage in moderate earthquakes',
      'Moderate risk of ground liquefaction in some areas',
      'Foundation stability needs assessment'
    ],
    constructionRecommendations: [
      'Strict adherence to seismic building codes',
      'Seismic reinforcement recommended',
      'Professional geotechnical assessment required',
      'Enhanced foundation design necessary',
      'Consider base isolation for critical structures'
    ],
    costMultiplier: 1.30
  },
  'Zone 3': {
    zone: 'Zone 3',
    pga: '0.15g - 0.25g',
    description: 'High seismic hazard zone requiring special attention',
    riskLevel: 'High',
    conditions: [
      'High probability of significant ground shaking',
      'Active fault lines present',
      'History of moderate to strong earthquakes',
      'Requires comprehensive site evaluation'
    ],
    vulnerability: [
      'High vulnerability to earthquake damage',
      'Significant risk of structural failure',
      'High risk of ground liquefaction',
      'Potential for landslides and slope failures',
      'Foundation instability concerns'
    ],
    constructionRecommendations: [
      'Mandatory strict seismic building codes',
      'Comprehensive seismic reinforcement required',
      'Professional geotechnical and seismic assessment mandatory',
      'Enhanced foundation design with deep foundations',
      'Consider seismic isolation systems',
      'Regular structural inspections recommended',
      'Use earthquake-resistant construction techniques'
    ],
    costMultiplier: 1.50
  },
  'Zone 4': {
    zone: 'Zone 4',
    pga: '> 0.25g',
    description: 'Very high seismic hazard zone - highest risk area',
    riskLevel: 'Very High',
    conditions: [
      'Very high probability of severe ground shaking',
      'Active major fault lines',
      'History of major destructive earthquakes',
      'Most hazardous zone in Pakistan',
      'Requires extensive engineering solutions'
    ],
    vulnerability: [
      'Very high vulnerability to earthquake damage',
      'High risk of complete structural failure',
      'Very high risk of ground liquefaction',
      'High risk of landslides and rockfalls',
      'Severe foundation instability',
      'Potential for surface rupture'
    ],
    constructionRecommendations: [
      'Maximum seismic building code compliance required',
      'Extensive seismic reinforcement mandatory',
      'Comprehensive geotechnical and seismic studies essential',
      'Advanced foundation systems required (piles, deep foundations)',
      'Seismic isolation or damping systems highly recommended',
      'Specialized earthquake-resistant design mandatory',
      'Regular monitoring and maintenance required',
      'Consider alternative construction sites if possible',
      'Use only certified earthquake-resistant materials'
    ],
    costMultiplier: 1.80
  }
};

export function getZoneInfo(zoneName: string): EarthquakeZoneInfo | null {
  return earthquakeZonesInfo[zoneName] || null;
}

