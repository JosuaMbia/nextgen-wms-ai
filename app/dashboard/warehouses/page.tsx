'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Package, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentStock: number;
  status: 'active' | 'maintenance' | 'inactive';
  zones: number;
  employees: number;
}

// Mock data for initial display
const mockWarehouses: Warehouse[] = [
  { id: '1', name: 'Main Distribution Center', location: 'Paris, France', capacity: 50000, currentStock: 35000, status: 'active', zones: 12, employees: 45 },
  { id: '2', name: 'North Regional Hub', location: 'Lille, France', capacity: 30000, currentStock: 28500, status: 'active', zones: 8, employees: 28 },
  { id: '3', name: 'South Logistics Center', location: 'Marseille, France', capacity: 40000, currentStock: 15000, status: 'maintenance', zones: 10, employees: 35 },
  { id: '4', name: 'West Storage Facility', location: 'Bordeaux, France', capacity: 25000, currentStock: 22000, status: 'active', zones: 6, employees: 20 },
];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredWarehouses = warehouses.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getUtilization = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-7 w-7 text-cyan-400" />
            Warehouse Management
          </h1>
          <p className="text-gray-400 mt-1">Manage and monitor all warehouse locations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Warehouse
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Warehouses</div>
          <div className="text-2xl font-bold text-white mt-1">{warehouses.length}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Capacity</div>
          <div className="text-2xl font-bold text-white mt-1">
            {warehouses.reduce((sum, w) => sum + w.capacity, 0).toLocaleString()} units
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Active Warehouses</div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            {warehouses.filter(w => w.status === 'active').length}
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Average Utilization</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {Math.round(warehouses.reduce((sum, w) => sum + getUtilization(w.currentStock, w.capacity), 0) / warehouses.length)}%
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-700">
          <Filter className="h-5 w-5" />
          Filters
        </button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredWarehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{warehouse.name}</h3>
                <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                  <MapPin className="h-4 w-4" />
                  {warehouse.location}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(warehouse.status)}`}>
                {warehouse.status.charAt(0).toUpperCase() + warehouse.status.slice(1)}
              </span>
            </div>

            {/* Utilization Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Capacity Utilization</span>
                <span className="text-white font-medium">{getUtilization(warehouse.currentStock, warehouse.capacity)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    getUtilization(warehouse.currentStock, warehouse.capacity) > 90
                      ? 'bg-red-500'
                      : getUtilization(warehouse.currentStock, warehouse.capacity) > 70
                      ? 'bg-yellow-500'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${getUtilization(warehouse.currentStock, warehouse.capacity)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-xs">Current Stock</div>
                <div className="text-white font-semibold">{warehouse.currentStock.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Zones</div>
                <div className="text-white font-semibold">{warehouse.zones}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Employees</div>
                <div className="text-white font-semibold">{warehouse.employees}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add New Warehouse</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Warehouse Name</label>
                <input type="text" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Enter name" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Location</label>
                <input type="text" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="City, Country" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Capacity</label>
                  <input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Units" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Zones</label>
                  <input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Number" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg">Add Warehouse</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
