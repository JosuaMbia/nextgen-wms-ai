'use client';

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Activity, MapPin, BarChart3 } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  type: 'storage' | 'receiving' | 'shipping' | 'picking' | 'staging' | 'quarantine';
  capacity: number;
  used: number;
  temperature?: number;
  humidity?: number;
  items: number;
  status: 'normal' | 'warning' | 'alert';
}

export default function DigitalTwinPage() {
  const [zones, setZones] = useState<Zone[]>([
    { id: 'Z1', name: 'Zone A - Electronics', type: 'storage', capacity: 1000, used: 850, temperature: 22, humidity: 45, items: 320, status: 'alert' },
    { id: 'Z2', name: 'Zone B - Components', type: 'storage', capacity: 800, used: 480, temperature: 21, humidity: 42, items: 180, status: 'normal' },
    { id: 'Z3', name: 'Zone C - Heavy Goods', type: 'storage', capacity: 1200, used: 420, temperature: 20, humidity: 50, items: 95, status: 'normal' },
    { id: 'Z4', name: 'Receiving Dock', type: 'receiving', capacity: 500, used: 320, items: 45, status: 'warning' },
    { id: 'Z5', name: 'Shipping Area 1', type: 'shipping', capacity: 600, used: 180, items: 28, status: 'normal' },
    { id: 'Z6', name: 'Picking Zone', type: 'picking', capacity: 300, used: 240, items: 156, status: 'warning' },
    { id: 'Z7', name: 'Staging Area', type: 'staging', capacity: 400, used: 85, items: 22, status: 'normal' },
    { id: 'Z8', name: 'Quarantine', type: 'quarantine', capacity: 200, used: 45, items: 12, status: 'normal' },
  ]);

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [liveUpdate, setLiveUpdate] = useState(true);

  useEffect(() => {
    if (!liveUpdate) return;
    
    const interval = setInterval(() => {
      setZones(prev => prev.map(zone => ({
        ...zone,
        used: Math.max(0, Math.min(zone.capacity, zone.used + (Math.random() - 0.5) * 20)),
        items: Math.max(0, zone.items + Math.floor((Math.random() - 0.5) * 5)),
        temperature: zone.temperature ? zone.temperature + (Math.random() - 0.5) * 0.5 : undefined,
        humidity: zone.humidity ? zone.humidity + (Math.random() - 0.5) * 2 : undefined,
        status: (zone.used / zone.capacity > 0.8) ? 'alert' : (zone.used / zone.capacity > 0.6) ? 'warning' : 'normal'
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [liveUpdate]);

  const getZoneColor = (zone: Zone) => {
    const utilization = (zone.used / zone.capacity) * 100;
    if (utilization > 80) return 'bg-red-500';
    if (utilization > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getZoneBorderColor = (zone: Zone) => {
    const utilization = (zone.used / zone.capacity) * 100;
    if (utilization > 80) return 'border-red-500';
    if (utilization > 60) return 'border-yellow-500';
    return 'border-green-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'storage': return Package;
      case 'receiving': return TrendingUp;
      case 'shipping': return Activity;
      case 'picking': return MapPin;
      case 'staging': return BarChart3;
      case 'quarantine': return AlertTriangle;
      default: return Package;
    }
  };

  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const totalUsed = zones.reduce((sum, z) => sum + z.used, 0);
  const totalItems = zones.reduce((sum, z) => sum + z.items, 0);
  const utilizationRate = ((totalUsed / totalCapacity) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Digital Twin - Vue Entrepôt</h1>
          <p className="text-slate-600 mt-1">Visualisation temps réel de votre entrepôt logistique</p>
        </div>
        <button
          onClick={() => setLiveUpdate(!liveUpdate)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            liveUpdate ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          <Activity className={`h-4 w-4 inline mr-2 ${liveUpdate ? 'animate-pulse' : ''}`} />
          {liveUpdate ? 'Live' : 'Paused'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Taux d'utilisation</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{utilizationRate}%</p>
            </div>
            <BarChart3 className="h-10 w-10 text-cyan-500" />
          </div>
          <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                parseFloat(utilizationRate) > 80 ? 'bg-red-500' : 
                parseFloat(utilizationRate) > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${utilizationRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Capacité totale</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCapacity.toLocaleString()}</p>
            </div>
            <Package className="h-10 w-10 text-blue-500" />
          </div>
          <p className="text-xs text-slate-500 mt-2">m² disponibles</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Espace utilisé</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{Math.round(totalUsed).toLocaleString()}</p>
            </div>
            <MapPin className="h-10 w-10 text-purple-500" />
          </div>
          <p className="text-xs text-slate-500 mt-2">m² occupés</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Articles stockés</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalItems.toLocaleString()}</p>
            </div>
            <Activity className="h-10 w-10 text-green-500" />
          </div>
          <p className="text-xs text-slate-500 mt-2">références actives</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Plan de l'entrepôt</h2>
        <div className="grid grid-cols-4 gap-4">
          {zones.map((zone) => {
            const Icon = getTypeIcon(zone.type);
            const utilization = (zone.used / zone.capacity) * 100;
            
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                  getZoneBorderColor(zone)
                } ${
                  selectedZone?.id === zone.id ? 'ring-4 ring-cyan-200' : ''
                } bg-white`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`h-5 w-5 ${
                    zone.status === 'alert' ? 'text-red-500' :
                    zone.status === 'warning' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <span className="text-xs font-bold text-slate-600">{zone.id}</span>
                </div>
                
                <h3 className="font-semibold text-sm text-slate-900 mb-2 text-left">{zone.name}</h3>
                
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getZoneColor(zone)}`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{utilization.toFixed(0)}%</span>
                    <span className="text-slate-600">{zone.items} items</span>
                  </div>

                  {zone.temperature && (
                    <div className="text-xs text-slate-500">
                      🌡️ {zone.temperature.toFixed(1)}°C | 💧 {zone.humidity?.toFixed(0)}%
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedZone && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedZone.name}</h2>
              <p className="text-slate-600 text-sm mt-1">Zone {selectedZone.id} - Type: {selectedZone.type}</p>
            </div>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Capacité</p>
              <p className="text-2xl font-bold text-slate-900">{selectedZone.capacity} m²</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Utilisé</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round(selectedZone.used)} m²</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Articles</p>
              <p className="text-2xl font-bold text-slate-900">{selectedZone.items}</p>
            </div>
          </div>

          {selectedZone.temperature && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">Température</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{selectedZone.temperature.toFixed(1)}°C</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">Humidité</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{selectedZone.humidity?.toFixed(0)}%</p>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <p className="text-sm text-cyan-900">
              <strong>Statut:</strong> {
                selectedZone.status === 'alert' ? '⚠️ Capacité critique - Réorganisation recommandée' :
                selectedZone.status === 'warning' ? '⚡ Attention - Capacité élevée' :
                '✅ Fonctionnement normal'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
