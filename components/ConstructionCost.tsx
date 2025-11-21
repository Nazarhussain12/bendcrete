'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Point, FloodRisk, EarthquakeZoneResult } from '@/lib/geospatial-utils';
import { getZoneInfo } from '@/lib/earthquake-zones-info';

interface ConstructionCostProps {
  location: Point | null;
  floodRisk: FloodRisk | null;
  earthquakeZone: EarthquakeZoneResult | null;
  baseCost: number; // Base construction cost per square foot
}

export default function ConstructionCost({ location, floodRisk, earthquakeZone, baseCost = 2000 }: ConstructionCostProps) {
  if (!location) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        <p>Select a location to see construction cost estimates</p>
      </div>
    );
  }

  const zoneInfo = earthquakeZone ? getZoneInfo(earthquakeZone.zone) : null;
  
  // Calculate cost multipliers
  const earthquakeMultiplier = zoneInfo?.costMultiplier || 1.0;
  const floodMultiplier = floodRisk?.level === 'High Risk' ? 1.3 : floodRisk?.level === 'Medium Risk' ? 1.15 : 1.0;
  const totalMultiplier = earthquakeMultiplier * floodMultiplier;
  
  // Cost breakdown
  const baseCostPerSqft = baseCost;
  const earthquakeCost = baseCostPerSqft * (earthquakeMultiplier - 1);
  const floodCost = baseCostPerSqft * (floodMultiplier - 1);
  const adjustedCostPerSqft = baseCostPerSqft * totalMultiplier;
  
  // Example for 1000 sqft house
  const houseSize = 1000;
  const totalCost = adjustedCostPerSqft * houseSize;
  const baseTotalCost = baseCostPerSqft * houseSize;
  const additionalCost = totalCost - baseTotalCost;

  // Chart data
  const costBreakdown = [
    { name: 'Base Construction', value: baseTotalCost, color: '#3b82f6' },
    { name: 'Earthquake Mitigation', value: earthquakeCost * houseSize, color: '#f59e0b' },
    { name: 'Flood Protection', value: floodCost * houseSize, color: '#10b981' }
  ].filter(item => item.value > 0);

  const multiplierData = [
    { factor: 'Base Cost', multiplier: 1.0, cost: baseCostPerSqft },
    { factor: 'Earthquake Zone', multiplier: earthquakeMultiplier, cost: baseCostPerSqft * earthquakeMultiplier },
    { factor: 'Flood Risk', multiplier: floodMultiplier, cost: baseCostPerSqft * earthquakeMultiplier * floodMultiplier },
  ];

  const pieData = costBreakdown.map(item => ({
    name: item.name,
    value: Math.round(item.value)
  }));

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Construction Cost Estimation</h2>
      
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">Base Cost (per sqft)</p>
          <p className="text-2xl font-bold text-blue-900">Rs. {baseCostPerSqft.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium mb-1">Adjusted Cost (per sqft)</p>
          <p className="text-2xl font-bold text-orange-900">Rs. {adjustedCostPerSqft.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium mb-1">Total (1000 sqft house)</p>
          <p className="text-2xl font-bold text-green-900">Rs. {totalCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Additional Cost Info */}
      {additionalCost > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Additional Cost:</strong> Rs. {additionalCost.toLocaleString()} for risk mitigation measures
            ({((totalMultiplier - 1) * 100).toFixed(1)}% increase)
          </p>
        </div>
      )}

      {/* Cost Breakdown Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-2">Cost Breakdown (1000 sqft)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={costBreakdown} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10 }}
              width={50}
            />
            <Tooltip 
              formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Distribution Pie Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-2">Cost Distribution</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Factors Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-2">Cost Factors</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1.5">Factor</th>
                <th className="text-right p-1.5">Multiplier</th>
                <th className="text-right p-1.5">Cost/sqft</th>
              </tr>
            </thead>
            <tbody>
              {multiplierData.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-1.5 text-gray-700">{row.factor}</td>
                  <td className="text-right p-1.5">{row.multiplier.toFixed(2)}x</td>
                  <td className="text-right p-1.5">Rs. {row.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Notes */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h3 className="text-xs font-semibold mb-2 text-gray-700">Notes:</h3>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>Base cost assumes standard construction</li>
          <li>Earthquake mitigation: seismic reinforcement & foundation</li>
          <li>Flood protection: elevated foundations & waterproofing</li>
          <li>Costs may vary based on site conditions</li>
          <li>Consult professionals for accurate estimates</li>
        </ul>
      </div>
    </div>
  );
}

