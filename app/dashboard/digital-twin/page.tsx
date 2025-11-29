'use client';

import { useState } from 'react';
import { Boxes, Eye, ZoomIn, ZoomOut, RotateCcw, Layers, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  type: 'storage' | 'receiving' | 'shipping' | 'staging';
  utilization: number;
  temperature: number;
  humidity: number;
  status: 'normal' | 'warning' | 'alert';
  items: number;
}

const warehouseZones: Zone[] = [
  { id: 'A1', name: 'Zone A - Electronics', type: 'storage', utilization: 85, temperature: 22, humidity: 45, status: 'normal', items: 2450 },
  { id: 'A2', name: 'Zone A - Components', type: 'storage', utilization: 72, temperature: 21, humidity: 48, status: 'normal', items: 1830 },
  { id: 'B1', name: 'Zone B - Heavy Equipment', type: 'storage', utilization: 95, temperature: 23, humidity: 42, status: 'warning', items: 450 },
  { id: 'B2', name: 'Zone B - Machinery', type: 'storage', utilization: 68, temperature: 22, humidity: 44, status: 'normal', items: 320 },
  { id: 'C1', name: 'Receiving Dock', type: 'receiving', utilization: 40, temperature: 24, humidity: 50, status: 'normal', items: 125 },
  { id: 'C2', name: 'Shipping Dock', type: 'shipping', utilization: 55, temperature: 23, humidity: 48, status: 'normal', items: 230 },
  { id: 'D1', name: 'Staging Area 1', type: 'staging', utilization: 78, temperature: 22, humidity: 46, status: 'normal', items: 580 },
  { id: 'D2', name: 'Cold Storage', type: 'storage', utilization: 92, temperature: 4, humidity: 65, status: 'alert', items: 890 },
];

export default function DigitalTwinPage() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [zoom, setZoom] = useState(100);

  const getZoneColor = (zone: Zone) => {
    if (zone.status === 'alert') return 'bg-red-500/30 border-red-500';
    if (zone.status === 'warning') return 'bg-yellow-500/30 border-yellow-500';
    if (zone.utilization > 85) return 'bg-orange-500/30 border-orange-500';
    return 'bg-cyan-500/30 border-cyan-500';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'receiving': return 'bg-green-500';
      case 'shipping': return 'bg-blue-500';
      case 'staging': return 'bg-purple-500';
      default: return 'bg-cyan-500';
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Main Visualization */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Boxes className="h-7 w-7 text-cyan-400" />
              Digital Twin - Warehouse View
            </h1>
            <p className="text-gray-400 mt-1">Real-time 3D visualization of warehouse operations</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"><ZoomOut className="h-5 w-5 text-gray-400" /></button>
            <span className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"><ZoomIn className="h-5 w-5 text-gray-400" /></button>
            <button onClick={() => setZoom(100)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"><RotateCcw className="h-5 w-5 text-gray-400" /></button>
          </div>
        </div>

        {/* Warehouse Grid */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-[calc(100%-80px)] overflow-auto">
          <div className="grid grid-cols-4 gap-4 min-h-[400px]" style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top left' }}>
            {warehouseZones.map((zone) => (
              <div key={zone.id} onClick={() => setSelectedZone(zone)} className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${getZoneColor(zone)} ${selectedZone?.id === zone.id ? 'ring-2 ring-white' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-bold">{zone.id}</span>
                  <span className={`w-3 h-3 rounded-full ${zone.status === 'alert' ? 'bg-red-500 animate-pulse' : zone.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                </div>
                <div className="text-gray-300 text-sm mb-2">{zone.name}</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Utilization</span>
                    <span className="text-white">{zone.utilization}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full">
                    <div className={`h-full rounded-full ${zone.utilization > 90 ? 'bg-red-500' : zone.utilization > 75 ? 'bg-yellow-500' : 'bg-cyan-500'}`} style={{ width: `${zone.utilization}%` }} />
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs text-white ${getTypeColor(zone.type)}`}>{zone.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-80 border-l border-slate-700 p-4 space-y-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-white">Zone Details</h3>
        {selectedZone ? (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xl font-bold text-white">{selectedZone.id}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${selectedZone.status === 'alert' ? 'bg-red-500/20 text-red-400' : selectedZone.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{selectedZone.status}</span>
              </div>
              <div className="text-gray-300 mb-4">{selectedZone.name}</div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Items Stored</span><span className="text-white font-medium">{selectedZone.items.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Utilization</span><span className="text-white font-medium">{selectedZone.utilization}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Temperature</span><span className="text-white font-medium">{selectedZone.temperature}°C</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Humidity</span><span className="text-white font-medium">{selectedZone.humidity}%</span></div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-gray-300 text-sm">View Inventory</button>
                <button className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-gray-300 text-sm">Check Activity Log</button>
                <button className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-gray-300 text-sm">Adjust Settings</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">Select a zone to view details</div>
        )}

        {/* Legend */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h4 className="text-white font-medium mb-3">Legend</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-300">Normal</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-gray-300">Warning</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="text-gray-300">Alert</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
