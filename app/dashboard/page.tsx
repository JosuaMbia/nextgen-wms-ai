'use client';

import { useState } from 'react';
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
      title: 'Warehouse Utilization',
      value: '78.3%',
      change: 1.8,
      icon: <AlertCircle className="h-5 w-5" />
    },
    {
      title: 'Efficiency Score',
      value: '92/100',
      change: 3.5,
      icon: <Zap className="h-5 w-5" />
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Welcome to NextGen WMS AI - Real-time Warehouse Intelligence</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-slate-900 rounded-lg p-6 border border-slate-800 hover:border-cyan-500 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">{metric.title}</span>
                <div className="text-cyan-400">{metric.icon}</div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${metric.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </span>
                <span className="text-slate-500 text-sm">vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-8 border border-cyan-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
          <p className="text-slate-300 mb-6">
            Your NextGen WMS AI system is now active. Start by connecting your Firebase credentials and setting up your first warehouse.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-medium">
              Setup Warehouse
            </button>
            <button className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-medium">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
