'use client';

import { useState, useEffect } from 'react';
import { BarChart, TrendingUp, AlertCircle, Zap } from 'lucide-react';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricCard[]>([
    {
      title: 'Total SKUs',
      value: '12,847',
      change: 5.2,
      icon: <BarChart className="h-5 w-5" />
    },
    {
      title: 'Active Orders',
      value: '3,429',
      change: -2.1,
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      title: 'Inventory Health',
      value: '94.7%',
      change: 2.4,
      icon: <Zap className="h-5 w-5" />
    },
    {
      title: 'Alerts',
      value: '7',
      change: -1.5,
      icon: <AlertCircle className="h-5 w-5" />
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Warehouse Dashboard</h1>
        <p className="text-slate-400">Real-time monitoring and predictive analytics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-cyan-600/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">{metric.title}</h3>
              <div className="text-cyan-500">{metric.icon}</div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-white">{metric.value}</p>
              <span
                className={`text-xs font-semibold ${
                  metric.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {metric.change >= 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Forecast */}
        <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Inventory Forecast (7 days)</h2>
          <div className="h-64 flex items-center justify-center text-slate-500">
            <p>Chart rendering area - Connect to analytics service</p>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Recent Alerts</h2>
          <div className="space-y-3">
            {[
              { type: 'warning', msg: 'Low stock: SKU-4521' },
              { type: 'error', msg: 'Picking delay detected' },
              { type: 'info', msg: 'Order batch optimized' }
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-slate-800/50">
                <div
                  className={`h-2 w-2 rounded-full ${
                    alert.type === 'error'
                      ? 'bg-red-500'
                      : alert.type === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                />
                <span className="text-slate-300">{alert.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-6 rounded-lg border border-slate-800 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 p-6">
        <h2 className="mb-3 text-lg font-bold text-white">AI Insights & Recommendations</h2>
        <p className="text-slate-300">
          Based on current metrics, our AI recommends: Optimize picking routes for zone C2 (estimated 12% time savings), adjust stock levels for high-demand items, and monitor weather-related delivery delays.
        </p>
      </div>
    </div>
  );
}
