'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, ProductCategory } from '@/lib/services/ProductService';

export interface UseProductsOptions {
  tenantId: string;
  category?: ProductCategory;
  status?: 'active' | 'inactive' | 'discontinued';
  searchTerm?: string;
  realtime?: boolean;
}

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductBySKU: (sku: string) => Product | undefined;
  getProductsByCategory: (category: ProductCategory) => Product[];
  searchProducts: (term: string) => Product[];
}

export function useProducts(options: UseProductsOptions): UseProductsResult {
  const { tenantId, category, status, searchTerm, realtime = true } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Real-time listener for products
  useEffect(() => {
    if (!realtime) return;

    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        orderBy('name', 'asc')
      ];

      if (category) {
        constraints.push(where('category', '==', category));
      }
      if (status) {
        constraints.push(where('status', '==', status));
      }

      const productsRef = collection(db, 'tenants', tenantId, 'products');
      const q = query(productsRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          
          // Apply search filter if provided
          let filteredProducts = productsData;
          if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filteredProducts = productsData.filter(product => 
              product.name.toLowerCase().includes(lowerSearchTerm) ||
              product.sku.toLowerCase().includes(lowerSearchTerm) ||
              product.description?.toLowerCase().includes(lowerSearchTerm)
            );
          }
          
          setProducts(filteredProducts);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching products:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up products listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [tenantId, category, status, searchTerm, realtime]);

  // Create product function
  const createProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    try {
      const productsRef = collection(db, 'tenants', tenantId, 'products');
      
      // Check for duplicate SKU
      const existingProduct = products.find(p => p.sku === data.sku);
      if (existingProduct) {
        throw new Error(`Product with SKU ${data.sku} already exists`);
      }

      await addDoc(productsRef, {
        ...data,
        tenantId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'system',
        updatedBy: 'system'
      });
    } catch (err) {
      console.error('Error creating product:', err);
      throw err;
    }
  };

  // Update product function
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      // Check for SKU uniqueness if SKU is being updated
      if (updates.sku) {
        const existingProduct = products.find(p => p.sku === updates.sku && p.id !== id);
        if (existingProduct) {
          throw new Error(`Product with SKU ${updates.sku} already exists`);
        }
      }

      const productRef = doc(db, 'tenants', tenantId, 'products', id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: Timestamp.now(),
        updatedBy: 'system'
      });
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  // Delete product function
  const deleteProduct = async (id: string) => {
    try {
      const productRef = doc(db, 'tenants', tenantId, 'products', id);
      await deleteDoc(productRef);
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  // Get product by SKU
  const getProductBySKU = (sku: string): Product | undefined => {
    return products.find(product => product.sku === sku);
  };

  // Get products by category
  const getProductsByCategory = (category: ProductCategory): Product[] => {
    return products.filter(product => product.category === category);
  };

  // Search products
  const searchProducts = (term: string): Product[] => {
    const lowerTerm = term.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(lowerTerm) ||
      product.sku.toLowerCase().includes(lowerTerm) ||
      product.description?.toLowerCase().includes(lowerTerm)
    );
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductBySKU,
    getProductsByCategory,
    searchProducts,
  };
}
