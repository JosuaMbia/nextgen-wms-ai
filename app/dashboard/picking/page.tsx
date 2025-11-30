'use client';

import { useState } from 'react';
import { MapPin, Package, Zap, Map } from 'lucide-react';

const PickingDashboard = () => {
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);

  // Simulated picking data with waypoints
  const pickingOrder = {
    orderId: 'ORD-2024-1001',
    status: 'IN_PROGRESS',
    itemsTotal: 12,
    itemsPicked: 8,
    estimatedTime: '5 mins',
    route: [
      { id: 1, zone: 'FAST', location: 'A-1-3', item: 'SKU-100', qty: 5, x: 100, y: 100 },
      { id: 2, zone: 'SLOW', location: 'C-2-5', item: 'SKU-200', qty: 3, x: 300, y: 200 },
      { id: 3, zone: 'COLD', location: 'B-3-1', item: 'SKU-300', qty: 2, x: 150, y: 350 },
      { id: 4, zone: 'ADR', location: 'D-1-2', item: 'SKU-400', qty: 2, x: 450, y: 180 }
    ],
    pallets: [
      { palletId: 'PLT-001', items: ['SKU-100', 'SKU-200'], weight: 25, utilization: 65 },
      { palletId: 'PLT-002', items: ['SKU-300', 'SKU-400'], weight: 18, utilization: 48 }
    ]
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'FAST':
        return '#10b981';
      case 'SLOW':
        return '#f59e0b';
      case 'COLD':
        return '#3b82f6';
      case 'ADR':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Map className="w-10 h-10 text-cyan-400" />
            Order Picking - Visual Route
          </h1>
          <p className="text-slate-400">Real-time picking operations and route optimization</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold">Picking Progress</span>
            <span className="text-cyan-400 font-bold">{pickingOrder.itemsPicked}/{pickingOrder.itemsTotal} items picked</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${(pickingOrder.itemsPicked / pickingOrder.itemsTotal) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Visual Route Map */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-cyan-400" />
                Warehouse Route Map
              </h2>
              
              {/* SVG Warehouse Map */}
              <svg viewBox="0 0 600 500" className="w-full border border-slate-600 rounded-lg bg-slate-900/50">
                {/* Grid background */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="600" height="500" fill="url(#grid)" />

                {/* Zones */}
                <rect x="50" y="50" width="100" height="100" fill="#10b981" opacity="0.1" stroke="#10b981" strokeWidth="2" />
                <text x="100" y="105" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">FAST</text>

                <rect x="200" y="100" width="100" height="80" fill="#f59e0b" opacity="0.1" stroke="#f59e0b" strokeWidth="2" />
                <text x="250" y="145" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">SLOW</text>

                <rect x="100" y="250" width="100" height="100" fill="#3b82f6" opacity="0.1" stroke="#3b82f6" strokeWidth="2" />
                <text x="150" y="305" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">COLD</text>

                <rect x="350" y="80" width="100" height="100" fill="#ef4444" opacity="0.1" stroke="#ef4444" strokeWidth="2" />
                <text x="400" y="135" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">ADR</text>

                {/* Route Path */}
                <polyline
                  points={pickingOrder.route.map(wp => `${wp.x},${wp.y}`).join(' ')}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />

                {/* Waypoints */}
                {pickingOrder.route.map((waypoint) => (
                  <g key={waypoint.id} onClick={() => setSelectedWaypoint(waypoint.id)}>
                    <circle cx={waypoint.x} cy={waypoint.y} r="12" fill={getZoneColor(waypoint.zone)} opacity="0.8" />
                    <circle cx={waypoint.x} cy={waypoint.y} r="18" fill="none" stroke={getZoneColor(waypoint.zone)} strokeWidth="2" opacity={selectedWaypoint === waypoint.id ? 1 : 0.3} />
                    <text x={waypoint.x} y={waypoint.y + 25} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
                      {waypoint.id}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Order {pickingOrder.orderId}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-green-400 font-semibold">IN PROGRESS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Time:</span>
                  <span className="text-cyan-400 font-semibold">{pickingOrder.estimatedTime}</span>
                </div>
              </div>
            </div>

            {/* Waypoints List */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Picking Sequence
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pickingOrder.route.map((waypoint) => (
                  <div
                    key={waypoint.id}
                    onClick={() => setSelectedWaypoint(waypoint.id)}
                    className={`p-3 rounded-lg cursor-pointer transition border ${
                      selectedWaypoint === waypoint.id
                        ? 'bg-slate-700 border-cyan-400'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: getZoneColor(waypoint.zone) }}
                      >
                        {waypoint.id}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{waypoint.location}</p>
                        <p className="text-slate-400 text-xs">{waypoint.item} x{waypoint.qty}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Palletization */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-400" />
                Optimal Palletization
              </h3>
              <div className="space-y-3">
                {pickingOrder.pallets.map((pallet) => (
                  <div key={pallet.palletId} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-sm text-cyan-400">{pallet.palletId}</span>
                      <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">{pallet.utilization}% filled</span>
                    </div>
                    <div className="text-xs text-slate-400">Weight: {pallet.weight}kg | Items: {pallet.items.join(', ')}</div>
                    <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full"
                        style={{ width: `${pallet.utilization}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickingDashboard;
