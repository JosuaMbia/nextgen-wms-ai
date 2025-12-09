'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SalesOrder } from '@/types/sales-order-models';

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSalesOrders();
  }, []);

  const loadSalesOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = query(
        collection(db, 'sales-orders'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const orders: SalesOrder[] = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({ ...doc.data(), soId: doc.id } as SalesOrder);
      });
      
      setSalesOrders(orders);
      console.log('✅ Sales Orders loaded:', orders.length);
            console.log('✅ Sales Orders loaded successfully:', orders.length, 'orders');
    } catch (err) {
      console.error('Error loading sales orders:', err);
            console.error('❌ Firestore Error Details:', {
                      error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        code: (err as any)?.code,
        collection: 'sales-orders'
      });
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      in_picking: 'bg-purple-500',
      ready_to_ship: 'bg-indigo-500',
      shipped: 'bg-green-500',
      delivered: 'bg-emerald-500',
      cancelled: 'bg-red-500',
      on_hold: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Commandes de Vente (SO)</h1>
        <p className="text-gray-400 mt-2">
          Gérer et suivre vos Sales Orders générées depuis les devis clients
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && salesOrders.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg">Aucune commande de vente trouvée</p>
          <p className="text-gray-500 mt-2">
            Les Sales Orders générées depuis l'OCR apparaîtront ici
          </p>
        </div>
      )}

      {!loading && salesOrders.length > 0 && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Lignes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    OCR Ref
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {salesOrders.map((order) => (
                  <tr key={order.soId} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{order.soNumber}</div>
                      <div className="text-xs text-gray-400">{order.soId.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{order.clientName}</div>
                      {order.clientEmail && (
                        <div className="text-xs text-gray-400">{order.clientEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${
                          getStatusBadgeColor(order.status)
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">
                        {order.totalAmount.toFixed(2)} {order.currency}
                      </div>
                      <div className="text-xs text-gray-400">
                        HT: {order.subtotal.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {order.lines.length} ligne(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.ocrId ? (
                        <span className="text-xs text-blue-400">✅ OCR</span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-400">
        Total: {salesOrders.length} commande(s)
      </div>
    </div>
  );
}
