'use client';
import { useState } from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { DEMO_BATCHES } from '@/lib/wms-models';

const ReceivingDashboard = () => {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const batches = DEMO_BATCHES ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Package className="w-10 h-10 text-cyan-400" />
            Receiving Management
          </h1>
          <p className="text-slate-400">Batch receiving list, QC status, and preview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm font-semibold mb-2">Total Batches</div>
            <div className="text-3xl font-bold text-white">{batches.length}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm font-semibold mb-2">Approved</div>
            <div className="text-3xl font-bold text-green-400">{batches.length}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm font-semibold mb-2">Pending QC</div>
            <div className="text-3xl font-bold text-yellow-400">0</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm font-semibold mb-2">Total Quantity</div>
            <div className="text-3xl font-bold text-cyan-400">{batches.reduce((sum, b) => sum + (b?.quantity || 0), 0)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Batch List</h2>
              <div className="space-y-3">
                {batches.map((batch, idx) => (
                  <div
                    key={batch?.batchId || idx}
                    onClick={() => setSelectedBatch(idx)}
                    className={`border rounded-lg p-4 cursor-pointer transition ${selectedBatch === idx ? 'bg-slate-700 border-cyan-400' : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm text-cyan-400">{batch?.batchId}</div>
                        <p className="text-slate-300 text-sm">Qty: {batch?.quantity} units</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {selectedBatch !== null && batches[selectedBatch] ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-8">
                <h3 className="text-lg font-bold text-white mb-4">Batch Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Batch ID</div>
                    <div className="font-mono text-sm text-cyan-400">{batches[selectedBatch]?.batchId}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Quantity</div>
                    <div className="text-slate-300">{batches[selectedBatch]?.quantity} units</div>
                  </div>
                  <div className="pt-4 border-t border-slate-600">
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Status</div>
                    <div className="rounded-lg p-3 border border-green-600 bg-green-900/30 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="font-semibold text-sm text-green-400">APPROVED</span>
                    </div>
                  </div>
                </div>
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
