'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Reception {
  id: string;
  lot: string;
  productSku: string;
  expiryDate: string;
  temperature: number;
  quantity: number;
  receivedAt: string;
}

export default function ReceptionsPage() {
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReception, setNewReception] = useState({ lot: '', productSku: '', expiryDate: '', temperature: 0, quantity: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Reception | null>(null);

  useEffect(() => {
    fetchReceptions();
  }, []);

  const fetchReceptions = async () => {
    try {
      const res = await fetch('/api/v1/receptions');
      const data = await res.json();
      setReceptions(data.data || []);
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/v1/receptions?id=${editingId}` : '/api/v1/receptions';
    const method = editingId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingId ? editData : newReception),
    });
    fetchReceptions();
    setNewReception({ lot: '', productSku: '', expiryDate: '', temperature: 0, quantity: 0 });
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Confirmer suppression ?')) {
      await fetch(`/api/v1/receptions?id=${id}`, { method: 'DELETE' });
      fetchReceptions();
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Réceptions & Lots</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <input placeholder="Lot" value={editingId ? editData?.lot || '' : newReception.lot} onChange={(e) => editingId ? setEditData({...editData, lot: e.target.value}) : setNewReception({...newReception, lot: e.target.value})} className="border p-2 rounded" required />
          <input placeholder="SKU Produit" value={editingId ? editData?.productSku || '' : newReception.productSku} onChange={(e) => editingId ? setEditData({...editData, productSku: e.target.value}) : setNewReception({...newReception, productSku: e.target.value})} className="border p-2 rounded" required />
          <input type="date" value={editingId ? editData?.expiryDate || '' : newReception.expiryDate} onChange={(e) => editingId ? setEditData({...editData, expiryDate: e.target.value}) : setNewReception({...newReception, expiryDate: e.target.value})} className="border p-2 rounded" required />
          <input type="number" placeholder="Temp (°C)" value={editingId ? editData?.temperature || '' : newReception.temperature} onChange={(e) => editingId ? setEditData({...editData, temperature: Number(e.target.value)}) : setNewReception({...newReception, temperature: Number(e.target.value)})} className="border p-2 rounded" />
          <input type="number" placeholder="Qté" value={editingId ? editData?.quantity || '' : newReception.quantity} onChange={(e) => editingId ? setEditData({...editData, quantity: Number(e.target.value)}) : setNewReception({...newReception, quantity: Number(e.target.value)})} className="border p-2 rounded" required />
        </div>
        <button type="submit" className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {editingId ? 'Modifier' : 'Ajouter Réception'}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Lot</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Pérem.</th>
              <th className="p-3 text-left">Temp</th>
              <th className="p-3 text-left">Qté</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receptions.map((rec) => (
              <tr key={rec.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{rec.lot}</td>
                <td className="p-3">{rec.productSku}</td>
                <td className="p-3">{rec.expiryDate}</td>
                <td className="p-3">{rec.temperature}°C</td>
                <td className="p-3">{rec.quantity}</td>
                <td className="p-3">
                  <button onClick={() => { setEditingId(rec.id); setEditData(rec); }} className="text-blue-600 mr-2"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(rec.id)} className="text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
