'use client';

import { useState } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Point } from '@/lib/geospatial-utils';

interface LocationInputProps {
  onLocationSelect: (point: Point) => void;
  onCurrentLocation: () => void;
}

export default function LocationInput({ onLocationSelect, onCurrentLocation }: LocationInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Use Nominatim (OpenStreetMap geocoding) for location search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Pakistan')}&limit=1`,
        {
          headers: {
            'User-Agent': 'NDMAResilientConstructionPlatform/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        onLocationSelect({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        });
        setSearchQuery('');
      } else {
        alert('Location not found. Please try a different search term.');
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
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search location (e.g., Karachi, Lahore, Islamabad)..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={handleSearch}
        disabled={isSearching}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
      >
        <MapPin className="w-5 h-5" />
        {isSearching ? 'Searching...' : 'Search'}
      </button>
      <button
        onClick={onCurrentLocation}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-colors"
      >
        <Navigation className="w-5 h-5" />
        Current Location
      </button>
    </div>
  );
}

