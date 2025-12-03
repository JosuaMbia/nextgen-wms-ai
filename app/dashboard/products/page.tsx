'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Tag, BarChart3, AlertCircle, Edit, Trash2 } from 'lucide-react';

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
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  warehouse?: string;
}

const getProductStatus = (product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' => {
  if (product.quantity === 0) return 'out_of_stock';
  if (product.minStock && product.quantity < product.minStock) return 'low_stock';
  return 'in_stock';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_stock': return 'bg-green-500/20 text-green-400';
    case 'low_stock': return 'bg-yellow-500/20 text-yellow-400';
    case 'out_of_stock': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const stats = {
  total: 0,
  inStock: 0,
  lowStock: 0,
  outOfStock: 0,
  totalValue: 0,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    minStock: 0,
    avgStock: 0,
    maxStock: 0,
    price: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to add product');
      await fetchProducts();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      minStock: product.minStock || 0,
      avgStock: product.avgStock || 0,
      maxStock: product.maxStock || 0,
      price: product.price,
    });
    setShowAddModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const response = await fetch(`/api/v1/products?id=${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update product');
      await fetchProducts();
      setShowAddModal(false);
      setEditingProduct(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/v1/products?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting product');
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      category: '',
      quantity: 0,
      minStock: 0,
      avgStock: 0,
      maxStock: 0,
      price: 0,
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === 'all' || p.category === selectedCategory)
  );

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const updatedStats = {
    total: products.length,
    inStock: products.filter((p) => getProductStatus(p) === 'in_stock').length,
    lowStock: products.filter((p) => getProductStatus(p) === 'low_stock').length,
    outOfStock: products.filter((p) => getProductStatus(p) === 'out_of_stock').length,
    totalValue: products.reduce((sum, p) => sum + (p.quantity * p.price || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white mb-4">Products</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="flex-1 bg-slate-700 hover:bg-slate-600 rounded">
          <Plus className="h-4 w-4 text-gray-400" />Add New Products</button>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">{updatedStats.total}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">In Stock</div>
            <div className="text-2xl font-bold text-green-400 mt-1">{updatedStats.inStock}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Low Stock</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">{updatedStats.lowStock}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Out of Stock</div>
            <div className="text-2xl font-bold text-red-400 mt-1">{updatedStats.outOfStock}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Total Value</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">${updatedStats.totalValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 py-3 text-white placeholder-gray-400"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Product</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Quantity</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Min Stock</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Avg Stock</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Max Stock</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Price</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-slate-700/50">
                <td className="px-6 py-4 text-sm text-white">{product.name}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{product.category}</td>
                <td className="px-6 py-4 text-sm font-bold text-white">{product.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{product.minStock || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{product.avgStock || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{product.maxStock || '-'}</td>
                <td className="px-6 py-4 text-sm font-bold text-white">${product.price?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getProductStatus(product))}`}>
                    {getProductStatus(product).replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm flex gap-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="p-1 hover:bg-slate-600 rounded">
                    <Edit className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-1 hover:bg-slate-600 rounded">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
              
              {/* Stock Management Section */}
              <div className="border-t border-slate-600 pt-4 mt-4">
                <h3 className="font-semibold text-white mb-3">Stock Management</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Avg Stock</label>
                    <input
                      type="number"
                      value={formData.avgStock}
                      onChange={(e) => setFormData({ ...formData, avgStock: Number(e.target.value) })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Max Stock</label>
                    <input
                      type="number"
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t border-slate-600">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 rounded px-4 py-2 text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 rounded px-4 py-2 text-white font-medium">
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
