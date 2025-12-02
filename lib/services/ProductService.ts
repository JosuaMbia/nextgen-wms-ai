import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';

// Types
export type ProductCategory = 'electronics' | 'clothing' | 'food' | 'beverages' | 'furniture' | 'tools' | 'raw_materials' | 'packaging' | 'other';
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  manufacturer?: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in' | 'm';
  };
  weight: {
    value: number;
    unit: 'kg' | 'lb' | 'g';
  };
  pricing: {
    cost: number;
    price: number;
    currency: string;
    taxRate?: number;
  };
  supplier?: {
    id: string;
    name: string;
    contactEmail: string;
    leadTime: number;
  };
  images: string[];
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  attributes: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ProductFilters {
  category?: string;
  status?: string;
  brand?: string;
  supplier?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  discontinuedProducts: number;
  totalValue: number;
  averagePrice: number;
}

class ProductService {
  /**
   * Create new product
   */
  async createProduct(
    tenantId: string,
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<Product> {
    try {
      const productsCollection = collection(db, 'products');

      // Check if SKU already exists
      const skuQuery = query(productsCollection, where('sku', '==', data.sku));
      const existingSku = await getDocs(skuQuery);

      if (!existingSku.empty) {
        throw new Error('SKU already exists');
      }

      const productData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
        updatedBy: userId,
      };

      const docRef = await addDoc(productsCollection, productData);
      const newDoc = await getDoc(docRef);
      const savedData = newDoc.data();

      if (!savedData) {
        throw new Error('Failed to create product: could not retrieve saved data.');
      }

      return {
        id: newDoc.id,
        ...savedData,
        createdAt: savedData.createdAt.toDate(),
        updatedAt: savedData.updatedAt.toDate(),
      } as Product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create product');
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(tenantId: string, productId: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Product;
    } catch (error) {
      console.error('Error getting product:', error);
      throw new Error('Failed to get product');
    }
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(tenantId: string, sku: string): Promise<Product | null> {
    try {
      const productsCollection = collection(db, 'products');
      const q = query(productsCollection, where('sku', '==', sku), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Product;
    } catch (error) {
      console.error('Error getting product by SKU:', error);
      throw new Error('Failed to get product by SKU');
    }
  }

  /**
   * List products with filters
   */
  async listProducts(tenantId: string, filters: ProductFilters = {}): Promise<Product[]> {
    try {
      const productsCollection = collection(db, 'products');
      const constraints: QueryConstraint[] = [];

      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.brand) {
        constraints.push(where('brand', '==', filters.brand));
      }

      if (filters.search) {
        constraints.push(where('name', '>=', filters.search));
        constraints.push(where('name', '<=', filters.search + '\uf8ff'));
      }

      constraints.push(orderBy('updatedAt', 'desc'));

      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(productsCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      let products = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Product;
      });

      // Apply price filters client-side
      if (filters.minPrice !== undefined) {
        products = products.filter(p => p.pricing.price >= filters.minPrice!);
      }

      if (filters.maxPrice !== undefined) {
        products = products.filter(p => p.pricing.price <= filters.maxPrice!);
      }

      return products;
    } catch (error) {
      console.error('Error listing products:', error);
      throw new Error('Failed to list products');
    }
  }

  /**
   * Update product
   */
  async updateProduct(
    tenantId: string,
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'createdBy'>>,
    userId: string
  ): Promise<Product> {
    try {
      const docRef = doc(db, 'products', productId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      return await this.getProduct(tenantId, productId) as Product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    try {
      const docRef = doc(db, 'products', productId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(tenantId: string): Promise<ProductStats> {
    try {
      const productsCollection = collection(db, 'products');
      const querySnapshot = await getDocs(productsCollection);

      let totalProducts = 0;
      let activeProducts = 0;
      let inactiveProducts = 0;
      let discontinuedProducts = 0;
      let totalValue = 0;
      let totalPrice = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalProducts++;

        if (data.status === 'active') activeProducts++;
        if (data.status === 'inactive') inactiveProducts++;
        if (data.status === 'discontinued') discontinuedProducts++;

        totalValue += data.pricing.cost || 0;
        totalPrice += data.pricing.price || 0;
      });

      return {
        totalProducts,
        activeProducts,
        inactiveProducts,
        discontinuedProducts,
        totalValue,
        averagePrice: totalProducts > 0 ? totalPrice / totalProducts : 0,
      };
    } catch (error) {
      console.error('Error getting product stats:', error);
      throw new Error('Failed to get product stats');
    }
  }

  /**
   * Update product status
   */
  async updateProductStatus(
    tenantId: string,
    productId: string,
    status: Product['status'],
    userId: string
  ): Promise<Product> {
    try {
      return await this.updateProduct(tenantId, productId, { status }, userId);
    } catch (error) {
      console.error('Error updating product status:', error);
      throw new Error('Failed to update product status');
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(tenantId: string, category: string): Promise<Product[]> {
    try {
      return await this.listProducts(tenantId, { category });
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw new Error('Failed to get products by category');
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
