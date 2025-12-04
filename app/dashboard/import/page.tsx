'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  minStock?: number | null;
  avgStock?: number | null;
  maxStock?: number | null;
}

type ProductForm = Omit<Product, 'id'>;

const emptyForm: ProductForm = {
  sku: '',
  name: '',
  category: '',
  quantity: 0,
  price: 0,
  minStock: undefined,
  avgStock: undefined,
  maxStock: undefined,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Helpers
  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      sku: product.sku,
      name: product.name,
      category: product.category ?? '',
      quantity: product.quantity,
      price: product.price,
      minStock: product.minStock ?? undefined,
      avgStock: product.avgStock ?? undefined,
      maxStock: product.maxStock ?? undefined,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleInputChange = (
    field: keyof ProductForm,
    value: string
  ) => {
    if (['quantity', 'price', 'minStock', 'avgStock', 'maxStock'].includes(field)) {
      const num = value === '' ? undefined : Number(value.replace(',', '.'));
      setForm((prev) => ({
        ...prev,
        [field]: Number.isNaN(num) ? prev[field] : (num as any),
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Validation simple pour le formulaire
  const validateForm = (): string | null => {
    if (!form.sku.trim()) return 'Le SKU est obligatoire.';
    if (!form.name.trim()) return 'Le nom est obligatoire.';
    if (form.quantity == null || Number.isNaN(form.quantity)) {
      return 'La quantité est obligatoire.';
    }
    if (form.price == null || Number.isNaN(form.price)) {
      return 'Le prix est obligatoire.';
    }

    const { minStock, avgStock, maxStock } = form;
    if (
      minStock != null &&
      avgStock != null &&
      maxStock != null &&
      (minStock > avgStock || avgStock > maxStock)
    ) {
      return 'La relation Min ≤ Moyen ≤ Max doit être respectée.';
    }
    return null;
  };

  // Fetch initial des produits
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/products');
      if (!res.ok) {
        throw new Error(`Erreur de chargement (${res.status})`);
      }
      const json = await res.json();
      const items: Product[] = json.data ?? json.products ?? [];
      setProducts(items);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erreur lors du chargement des produits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Création / Mise à jour
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...form,
        // Nettoyage : si les champs sont vides/undefined, ne pas envoyer NaN
        minStock: form.minStock ?? null,
        avgStock: form.avgStock ?? null,
        maxStock: form.maxStock ?? null,
      };

      const isEdit = !!editingProduct;
      const url = isEdit
        ? `/api/v1/products/${editingProduct!.id}`
        : '/api/v1/products';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Erreur lors de l’enregistrement.');
      }

      // Après succès, recharger la liste
      await fetchProducts();
      closeModal();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      setDeleting(true);
      setError(null);

      const res = await fetch(`/api/v1/products/${confirmDeleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Erreur lors de la suppression.');
      }

      // Mise à jour locale sans refetch complet (optimiste)
      setProducts((prev) => prev.filter((p) => p.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Produits
          </h1>
          <p className="text-sm text-slate-500">
            Gérez votre catalogue produits et les paramètres de stock (min / moyen / max).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table produits */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Qté
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Min
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Moyen
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Max
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-slate-500">
                    Chargement des produits…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-slate-500">
                    Aucun produit pour le moment. Ajoutez votre premier produit.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                      {product.sku}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-700">
                      {product.name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500">
                      {product.category || '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-slate-700">
                      {product.quantity}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-slate-700">
                      {product.minStock ?? '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-slate-700">
                      {product.avgStock ?? '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-slate-700">
                      {product.maxStock ?? '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-slate-700">
                      {product.price.toFixed(2)} €
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 mr-2"
                      >
                        <Edit2 className="mr-1 h-3 w-3" />
                        Éditer
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(product.id)}
                        className="inline-flex items-center rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={form.category ?? ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    value={form.quantity ?? ''}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Prix (EUR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price ?? ''}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Stock minimum
                  </label>
                  <input
                    type="number"
                    value={form.minStock ?? ''}
                    onChange={(e) => handleInputChange('minStock', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Stock moyen
                  </label>
                  <input
                    type="number"
                    value={form.avgStock ?? ''}
                    onChange={(e) => handleInputChange('avgStock', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Stock maximum
                  </label>
                  <input
                    type="number"
                    value={form.maxStock ?? ''}
                    onChange={(e) => handleInputChange('maxStock', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving
                    ? 'Enregistrement…'
                    : editingProduct
                    ? 'Mettre à jour'
                    : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale confirmation suppression */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900">
              Confirmer la suppression
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est définitive.
            </p>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
