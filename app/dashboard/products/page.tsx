'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock?: number;
  avgStock?: number;
  maxStock?: number;
  price: number;
  status?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '', name: '', category: '', quantity: 0,
    minStock: 0, avgStock: 0, maxStock: 0, price: 0,
  });

  useEffect(() => {
    fetch('/api/v1/products')
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : d.products || []))
      .catch(e => console.error(e));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await fetch('/api/v1/products');
        const products = await data.json();
        setProducts(Array.isArray(products) ? products : products.products || []);
        setShowAddModal(false);
        setFormData({ sku: '', name: '', category: '', quantity: 0, minStock: 0, avgStock: 0, maxStock: 0, price: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ sku: p.sku, name: p.name, category: p.category, quantity: p.quantity, minStock: p.minStock || 0, avgStock: p.avgStock || 0, maxStock: p.maxStock || 0, price: p.price });
    setShowAddModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch(`/api/v1/products?id=${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await fetch('/api/v1/products');
        const products = await data.json();
        setProducts(Array.isArray(products) ? products : products.products || []);
        setShowAddModal(false);
        setEditingProduct(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirm delete?')) return;
    try {
      await fetch(`/api/v1/products?id=${id}`, { method: 'DELETE' });
      const data = await fetch('/api/v1/products');
      const products = await data.json();
      setProducts(Array.isArray(products) ? products : products.products || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button onClick={() => { setEditingProduct(null); setFormData({ sku: '', name: '', category: '', quantity: 0, minStock: 0, avgStock: 0, maxStock: 0, price: 0 }); setShowAddModal(true); }} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-white rounded flex items-center gap-2">
          <Plus size={18} /> Add
        </button>
      </div>

      <div className="overflow-x-auto bg-slate-800 rounded">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">Min</th>
              <th className="px-4 py-2 text-left">Avg</th>
              <th className="px-4 py-2 text-left">Max</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                <td className="px-4 py-2">{p.sku}</td>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.quantity}</td>
                <td className="px-4 py-2">{p.minStock || '-'}</td>
                <td className="px-4 py-2">{p.avgStock || '-'}</td>
                <td className="px-4 py-2">{p.maxStock || '-'}</td>
                <td className="px-4 py-2">${p.price?.toFixed(2)}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => handleEdit(p)} className="text-blue-400"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-400"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded p-6 w-96">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit' : 'Add'} Product</h2>
            <form onSubmit={editingProduct ? handleUpdate : handleAdd} className="space-y-3">
              <input type="text" placeholder="SKU" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required />
              <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required />
              <input type="text" placeholder="Category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required />
              <input type="number" placeholder="Qty" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required />
              <input type="number" placeholder="Min" value={formData.minStock} onChange={(e) => setFormData({...formData, minStock: Number(e.target.value)})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" />
              <input type="number" placeholder="Avg" value={formData.avgStock} onChange={(e) => setFormData({...formData, avgStock: Number(e.target.value)})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" />
              <input type="number" placeholder="Max" value={formData.maxStock} onChange={(e) => setFormData({...formData, maxStock: Number(e.target.value)})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" />
              <input type="number" placeholder="Price" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 rounded px-4 py-2">Cancel</button>
                <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700 rounded px-4 py-2 font-medium">{editingProduct ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
