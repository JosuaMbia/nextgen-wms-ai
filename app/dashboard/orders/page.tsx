'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Search, Filter, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  warehouse: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

const mockOrders: Order[] = [
  { id: '1', orderNumber: 'ORD-2024-001', customer: 'Acme Corp', items: 5, total: 2499.99, status: 'processing', warehouse: 'Main DC', createdAt: '2024-11-29', priority: 'high' },
  { id: '2', orderNumber: 'ORD-2024-002', customer: 'TechStart Inc', items: 12, total: 8750.00, status: 'pending', warehouse: 'North Hub', createdAt: '2024-11-29', priority: 'medium' },
  { id: '3', orderNumber: 'ORD-2024-003', customer: 'Global Logistics', items: 3, total: 1200.50, status: 'shipped', warehouse: 'Main DC', createdAt: '2024-11-28', priority: 'low' },
  { id: '4', orderNumber: 'ORD-2024-004', customer: 'Prime Industries', items: 8, total: 5600.00, status: 'delivered', warehouse: 'South LC', createdAt: '2024-11-27', priority: 'medium' },
  { id: '5', orderNumber: 'ORD-2024-005', customer: 'Metro Supplies', items: 2, total: 450.00, status: 'cancelled', warehouse: 'West Facility', createdAt: '2024-11-27', priority: 'low' },
  { id: '6', orderNumber: 'ORD-2024-006', customer: 'BuildRight Co', items: 15, total: 12300.00, status: 'processing', warehouse: 'Main DC', createdAt: '2024-11-29', priority: 'high' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || o.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      processing: { color: 'bg-blue-500/20 text-blue-400', icon: Clock },
      shipped: { color: 'bg-purple-500/20 text-purple-400', icon: Truck },
      delivered: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      cancelled: { color: 'bg-red-500/20 text-red-400', icon: XCircle },
    };
    return configs[status] || configs.pending;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-cyan-400" />
            Order Management
          </h1>
          <p className="text-gray-400 mt-1">Track and manage all warehouse orders</p>
        </div>
        <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg">
          <Plus className="h-5 w-5" /> New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Orders</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Pending</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Processing</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{stats.processing}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Shipped</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{stats.shipped}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Revenue</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">${stats.totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Order #</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Customer</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Items</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Total</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Priority</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Date</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              return (
                <tr key={order.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">{order.customer}</td>
                  <td className="px-4 py-3 text-gray-300">{order.items}</td>
                  <td className="px-4 py-3 text-white">${order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="h-3 w-3" />{order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className={`font-medium ${getPriorityColor(order.priority)}`}>{order.priority}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{order.createdAt}</td>
                  <td className="px-4 py-3"><button className="p-1 hover:bg-slate-600 rounded"><Eye className="h-4 w-4 text-gray-400" /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
