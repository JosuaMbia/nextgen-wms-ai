'use client';

import { useEffect, useState } from 'react';
import { Plus, Package, Calendar, User, Trash2 } from 'lucide-react';
import type { TemperatureZone } from '@/types/inventory';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface ReceiptLine {
  productId: string;
  sku: string;
  name: string;
  receivedQty: number;
  lotNumber: string;
  expiryDate: string;
  temperatureZone: TemperatureZone;
}

interface ReceiptFormData {
  reference: string;
  supplier: string;
  date: string;
  lines: ReceiptLine[];
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ReceiptFormData>({
    reference: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    lines: [],
  });

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/receipts');
      const json = await res.json();
      if (json.success) {
        setReceipts(json.data || []);
      }
    } catch (e: any) {
      console.error(e);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/v1/products');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchProducts();
  }, []);

  const openModal = () => {
    setForm({
      reference: `RCP-${Date.now()}`,
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      lines: [],
    });
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          productId: '',
          sku: '',
          name: '',
          receivedQty: 0,
          lotNumber: '',
          expiryDate: '',
          temperatureZone: 'ambient',
        },
      ],
    }));
  };

  const removeLine = (index: number) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const updateLine = (index: number, field: keyof ReceiptLine, value: any) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      ),
    }));
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setForm((prev) => ({
        ...prev,
        lines: prev.lines.map((line, i) =>
          i === index
            ? { ...line, productId: product.id, sku: product.sku, name: product.name }
            : line
        ),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reference || form.lines.length === 0) {
      setError('Référence et au moins une ligne requises');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/v1/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Erreur');
      }
      await fetchReceipts();
      closeModal();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Réceptions</h1>
          <p className="text-sm text-slate-500">Gérez vos réceptions avec lots et dates</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle réception
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fournisseur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Lignes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">Chargement...</td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">Aucune réception</td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{receipt.reference}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{receipt.supplier || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {receipt.date?.toDate ? new Date(receipt.date.toDate()).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">{receipt.lines?.length || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={closeModal} />
            <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Nouvelle Réception</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Référence</label>
                    <input
                      type="text"
                      value={form.reference}
                      onChange={(e) => setForm({ ...form, reference: e.target.value })}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Fournisseur</label>
                    <input
                      type="text"
                      value={form.supplier}
                      onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Lignes</label>
                    <button type="button" onClick={addLine} className="text-sm text-cyan-600 hover:text-cyan-700">
                      + Ajouter ligne
                    </button>
                  </div>
                  {form.lines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      <select
                        value={line.productId}
                        onChange={(e) => selectProduct(idx, e.target.value)}
                        className="flex-1 rounded-md border-slate-300 text-sm"
                      >
                        <option value="">Sélectionner produit</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qté"
                        value={line.receivedQty}
                        onChange={(e) => updateLine(idx, 'receivedQty', Number(e.target.value))}
                        className="w-20 rounded-md border-slate-300 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Lot"
                        value={line.lotNumber}
                        onChange={(e) => updateLine(idx, 'lotNumber', e.target.value)}
                        className="w-24 rounded-md border-slate-300 text-sm"
                      />
                      <input
                        type="date"
                        value={line.expiryDate}
                        onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)}
                        className="w-32 rounded-md border-slate-300 text-sm"
                      />
                      <button type="button" onClick={() => removeLine(idx)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-700 hover:text-slate-900">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
