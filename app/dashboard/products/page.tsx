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
  price: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  warehouse?: string;
}

const []: Product[] = [
  { id: '1', sku: 'SKU-001', name: 'Industrial Sensor A1', category: 'Electronics', quantity: 1250, minStock: 200, price: 45.99, status: 'in_stock', warehouse: 'Main DC' },
  { id: '2', sku: 'SKU-002', name: 'Steel Bracket Type B', category: 'Hardware', quantity: 85, minStock: 100, price: 12.50, status: 'low_stock', warehouse: 'North Hub' },
  { id: '3', sku: 'SKU-003', name: 'Hydraulic Pump H200', category: 'Machinery', quantity: 450, minStock: 50, price: 299.99, status: 'in_stock', warehouse: 'Main DC' },
  { id: '4', sku: 'SKU-004', name: 'Safety Gloves XL', category: 'PPE', quantity: 0, minStock: 500, price: 8.99, status: 'out_of_stock', warehouse: 'South LC' },
  { id: '5', sku: 'SKU-005', name: 'Cable Assembly C12', category: 'Electronics', quantity: 2100, minStock: 300, price: 34.99, status: 'in_stock', warehouse: 'West Facility' },
  { id: '6', sku: 'SKU-006', name: 'Pneumatic Valve V5', category: 'Machinery', quantity: 120, minStock: 150, price: 89.99, status: 'low_stock', warehouse: 'North Hub' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/v1/products')
      .then(res => res.json())
      .then(data => setProducts(data.data || []))
      .catch(err => console.error('Error loading products:', err));
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate status dynamically for products without status field
  const getProductStatus = (product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (product.status) return product.status;
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
    total: products.length,
    inStock: products.filter(p => getProductStatus(p) === 'in_stock').length,
    lowStock: products.filter(p => getProductStatus(p) === 'low_stock').length,
    outOfStock: products.filter(p => getProductStatus(p) === 'out_of_stock').length,
    totalValue: products.reduce((sum, p) => sum + (p.quantity * (p.price || 0)), 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="h-7 w-7 text-cyan-400" />
            Product Inventory
          </h1>
          <p className="text-gray-400 mt-1">Manage products and inventory levels</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg">
          <Plus className="h-5 w-5" /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Products</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">In Stock</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{stats.inStock}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">{stats.lowStock}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Out of Stock</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{stats.outOfStock}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Value</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">${stats.totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none">
          {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">SKU</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Product Name</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Category</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Quantity</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Price</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 text-gray-300 font-mono text-sm">{product.sku}</td>
                <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                <td className="px-4 py-3 text-gray-300">{product.category}</td>
                <td className="px-4 py-3">
                  <span className={product.minStock && product.quantity < product.minStock ? 'text-yellow-400' : 'text-white'}>{product.quantity.toLocaleString()}</span>
                  {product.minStock && <span className="text-gray-500 text-sm"> / {product.minStock}</span>}
                </td>
                <td className="px-4 py-3 text-white">${product.price ? product.price.toFixed(2) : '0.00'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getProductStatus(product))}`}>
                    {getProductStatus(product).replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-slate-600 rounded"><Edit className="h-4 w-4 text-gray-400" /></button>
                    <button className="p-1 hover:bg-slate-600 rounded"><Trash2 className="h-4 w-4 text-gray-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add New Product</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-gray-400 text-sm mb-1">SKU</label><input type="text" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
                <div><label className="block text-gray-400 text-sm mb-1">Category</label><input type="text" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
              </div>
              <div><label className="block text-gray-400 text-sm mb-1">Product Name</label><input type="text" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-gray-400 text-sm mb-1">Quantity</label><input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
                <div><label className="block text-gray-400 text-sm mb-1">Min Stock</label><input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
                <div><label className="block text-gray-400 text-sm mb-1">Price</label><input type="number" step="0.01" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
