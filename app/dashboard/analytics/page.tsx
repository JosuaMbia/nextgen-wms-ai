'use client';

import { BarChart3, Package, ShoppingCart, DollarSign, Users, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsPage() {
  const kpis = [
    { title: 'Total Revenue', value: '$1.2M', change: '+12.5%', trend: 'up', icon: DollarSign },
    { title: 'Orders Processed', value: '8,423', change: '+8.2%', trend: 'up', icon: ShoppingCart },
    { title: 'Inventory Turnover', value: '4.8x', change: '-2.1%', trend: 'down', icon: Package },
    { title: 'Active Customers', value: '2,847', change: '+15.3%', trend: 'up', icon: Users },
  ];

  const monthlyData = [
    { month: 'Jan', orders: 650, revenue: 82000 },
    { month: 'Feb', orders: 720, revenue: 91000 },
    { month: 'Mar', orders: 810, revenue: 105000 },
    { month: 'Apr', orders: 780, revenue: 98000 },
    { month: 'May', orders: 890, revenue: 112000 },
    { month: 'Jun', orders: 950, revenue: 125000 },
    { month: 'Jul', orders: 1020, revenue: 138000 },
    { month: 'Aug', orders: 980, revenue: 132000 },
    { month: 'Sep', orders: 1100, revenue: 145000 },
    { month: 'Oct', orders: 1180, revenue: 158000 },
    { month: 'Nov', orders: 1250, revenue: 168000 },
  ];

  const topProducts = [
    { name: 'Industrial Sensor A1', sales: 1250, revenue: 57487.50 },
    { name: 'Hydraulic Pump H200', sales: 450, revenue: 134995.50 },
    { name: 'Cable Assembly C12', sales: 2100, revenue: 73479.00 },
    { name: 'Pneumatic Valve V5', sales: 890, revenue: 80091.10 },
    { name: 'Steel Bracket Type B', sales: 1800, revenue: 22500.00 },
  ];

  const warehousePerformance = [
    { name: 'Main DC', utilization: 78, efficiency: 94, orders: 4521 },
    { name: 'North Hub', utilization: 85, efficiency: 89, orders: 2134 },
    { name: 'South LC', utilization: 62, efficiency: 91, orders: 1245 },
    { name: 'West Facility', utilization: 71, efficiency: 87, orders: 523 },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-cyan-400" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-white text-sm">Last 30 days</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-gray-400 text-sm">{kpi.title}</div>
                <div className="text-2xl font-bold text-white mt-1">{kpi.value}</div>
              </div>
              <div className={`p-2 rounded-lg ${kpi.trend === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {kpi.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {kpi.change} vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Revenue</h3>
          <div className="flex items-end gap-2 h-48">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-cyan-500/80 rounded-t transition-all hover:bg-cyan-400" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
                <span className="text-gray-500 text-xs">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <div className="text-white text-sm font-medium">{product.name}</div>
                  <div className="text-gray-500 text-xs">{product.sales} units sold</div>
                </div>
                <div className="text-cyan-400 font-semibold">${product.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warehouse Performance */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Warehouse Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {warehousePerformance.map((wh, i) => (
            <div key={i} className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-white font-medium mb-3">{wh.name}</div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Utilization</span>
                    <span className="text-white">{wh.utilization}%</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${wh.utilization}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Efficiency</span>
                    <span className="text-white">{wh.efficiency}%</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${wh.efficiency}%` }} />
                  </div>
                </div>
                <div className="text-gray-400 text-sm mt-2">{wh.orders.toLocaleString()} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
