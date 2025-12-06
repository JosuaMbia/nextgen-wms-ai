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

  // Charger les réceptions
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
      setError('Erreur lors du chargement des réceptions');
    } finally {
      setLoading(false);
    }
  };

  // Charger les produits
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
      setError('Référence et au moins une ligne sont requises');
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
        throw new Error(json.message || 'Erreur lors de la création');
      }

      await fetchReceipts();
      closeModal();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Réceptions</h1>
          <p className="text-sm text-slate-500">
            Gérez vos réceptions de marchandises avec lots et dates de péremption
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle réception
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Liste des réceptions */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Référence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Fournisseur
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                  Lignes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Chargement...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Aucune réception pour le moment
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {receipt.reference}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {receipt.supplier || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {receipt.date?.toDate
                        ? new Date(receipt.date.toDate()).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {receipt.lines?.length || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
