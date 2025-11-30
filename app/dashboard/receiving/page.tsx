'use client';

import { useState } from 'react';
import { Package, CheckCircle, AlertCircle, Thermometer, Calendar } from 'lucide-react';
import { DEMO_BATCHES } from '@/lib/wms-models';

const ReceivingDashboard = () => {
  const [selectedBatch, setSelectedBatch] = useState(null);

  const getQCStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 border-green-300';
      case 'CONDITIONAL_APPROVAL':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-blue-100 border-blue-300';
    }
  };

  const getQCStatusIcon = (status: string) => {
    return status === 'APPROVED' ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : status === 'CONDITIONAL_APPROVAL' ? (
      <AlertCircle className="w-5 h-5 text-yellow-600" />
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Package className="w-10 h-10 text-cyan-400" />
            Receiving Management
          </h1>
          <p className="text-slate-400">Receiving documents, QC status, and batch preview</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm font-semibold mb-2">Total Batches</div>
            <div className="text-3xl font-bold text-white">{DEMO_BATCHES.length}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm font-semibold mb-2">Approved</div>
            <div className="text-3xl font-bold text-green-400">3</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm font-semibold mb-2">Pending QC</div>
            <div className="text-3xl font-bold text-yellow-400">0</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm font-semibold mb-2">Total Quantity</div>
            <div className="text-3xl font-bold text-cyan-400">{DEMO_BATCHES.reduce((sum, b) => sum + b.quantity, 0)}</div>
          </div>
        </div>

        {/* Receiving Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Batch Receiving List</h2>
              <div className="space-y-3">
                {DEMO_BATCHES.map((batch, idx) => (
                  <div
                    key={batch.batchId}
                    onClick={() => setSelectedBatch(idx)}
                    className={`border rounded-lg p-4 cursor-pointer transition ${selectedBatch === idx ? 'bg-slate-700 border-cyan-400' : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-cyan-400">{batch.batchId}</span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300">RECEIVED</span>
                        </div>
                        <p className="text-slate-300 text-sm">Product: {batch.productId} | Qty: {batch.quantity} units</p>
                      </div>
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Batch Preview */}
          <div className="lg:col-span-1">
            {selectedBatch !== null ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-8">
                <h3 className="text-lg font-bold text-white mb-4">Batch Details</h3>
                {DEMO_BATCHES[selectedBatch] && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Batch ID</div>
                      <div className="font-mono text-sm text-cyan-400">{DEMO_BATCHES[selectedBatch].batchId}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Product</div>
                      <div className="text-slate-300">{DEMO_BATCHES[selectedBatch].productId}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Quantity</div>
                      <div className="text-slate-300">{DEMO_BATCHES[selectedBatch].quantity} units</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-400" />
                      <div>
                        <div className="text-xs uppercase text-slate-500 font-semibold">Temperature</div>
                        <div className="text-slate-300">{DEMO_BATCHES[selectedBatch].temperature}°C</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      <div>
                        <div className="text-xs uppercase text-slate-500 font-semibold">Expiry</div>
                        <div className="text-slate-300 text-sm">{new Date(DEMO_BATCHES[selectedBatch].expiryDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-600">
                      <div className="text-xs uppercase text-slate-500 font-semibold mb-2">QC Status</div>
                      <div className={`rounded-lg p-3 border flex items-center gap-2 ${getQCStatusColor('APPROVED')}`}>
                        {getQCStatusIcon('APPROVED')}
                        <span className="font-semibold text-sm">APPROVED</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a batch to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivingDashboard;
