'use client';

export default function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-[280px]">
      <h3 className="text-sm font-semibold mb-3 text-gray-800">Map Legend</h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 opacity-30 border border-green-600 rounded"></div>
          <span className="text-gray-700">Zone 1 (Low Risk)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 opacity-30 border border-yellow-600 rounded"></div>
          <span className="text-gray-700">Zone 2A (Moderate)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-400 opacity-30 border border-orange-600 rounded"></div>
          <span className="text-gray-700">Zone 2B (Moderate)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 opacity-30 border border-red-600 rounded"></div>
          <span className="text-gray-700">Zone 3 (High Risk)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 opacity-30 border border-red-800 rounded"></div>
          <span className="text-gray-700">Zone 4 (Very High)</span>
        </div>
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 opacity-40 border border-blue-600 rounded"></div>
            <span className="text-gray-700">Flood Extent</span>
          </div>
          
        </div>
      </div>
    </div>
  );
}

