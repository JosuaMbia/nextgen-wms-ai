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
import { InventoryItem, StockMovement } from '@/lib/services/InventoryService';

export interface UseInventoryOptions {
  tenantId: string;
  warehouseId?: string;
  productId?: string;
  realtime?: boolean;
}

export interface UseInventoryResult {
  items: InventoryItem[];
  movements: StockMovement[];
  loading: boolean;
  error: Error | null;
  addStock: (productId: string, quantity: number, warehouseId: string, reason: string) => Promise<void>;
  removeStock: (productId: string, quantity: number, warehouseId: string, reason: string) => Promise<void>;
  transferStock: (productId: string, quantity: number, fromWarehouseId: string, toWarehouseId: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function useInventory(options: UseInventoryOptions): UseInventoryResult {
  const { tenantId, warehouseId, productId, realtime = true } = options;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Real-time listener for inventory items
  useEffect(() => {
    if (!realtime) return;

    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        orderBy('updatedAt', 'desc')
      ];

      if (warehouseId) {
        constraints.push(where('warehouseId', '==', warehouseId));
      }
      if (productId) {
        constraints.push(where('productId', '==', productId));
      }

      const itemsRef = collection(db, 'tenants', tenantId, 'inventory');
      const q = query(itemsRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const itemsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as InventoryItem[];
          setItems(itemsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching inventory items:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up inventory listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [tenantId, warehouseId, productId, realtime]);

  // Real-time listener for stock movements
  useEffect(() => {
    if (!realtime) return;

    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        orderBy('timestamp', 'desc')
      ];

      if (warehouseId) {
        constraints.push(where('warehouseId', '==', warehouseId));
      }
      if (productId) {
        constraints.push(where('productId', '==', productId));
      }

      const movementsRef = collection(db, 'tenants', tenantId, 'stockMovements');
      const q = query(movementsRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const movementsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as StockMovement[];
          setMovements(movementsData);
        },
        (err) => {
          console.error('Error fetching stock movements:', err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up movements listener:', err);
    }
  }, [tenantId, warehouseId, productId, realtime]);

  // Add stock function
  const addStock = async (productId: string, quantity: number, warehouseId: string, reason: string) => {
    try {
      // Update inventory item
      const itemsRef = collection(db, 'tenants', tenantId, 'inventory');
      // Record stock movement
      const movementsRef = collection(db, 'tenants', tenantId, 'stockMovements');
      await addDoc(movementsRef, {
        tenantId,
        productId,
        warehouseId,
        type: 'in',
        quantity,
        reason,
        timestamp: Timestamp.now(),
        createdBy: 'system'
      });
    } catch (err) {
      console.error('Error adding stock:', err);
      throw err;
    }
  };

  // Remove stock function
  const removeStock = async (productId: string, quantity: number, warehouseId: string, reason: string) => {
    try {
      // Record stock movement
      const movementsRef = collection(db, 'tenants', tenantId, 'stockMovements');
      await addDoc(movementsRef, {
        tenantId,
        productId,
        warehouseId,
        type: 'out',
        quantity,
        reason,
        timestamp: Timestamp.now(),
        createdBy: 'system'
      });
    } catch (err) {
      console.error('Error removing stock:', err);
      throw err;
    }
  };

  // Transfer stock function
  const transferStock = async (
    productId: string,
    quantity: number,
    fromWarehouseId: string,
    toWarehouseId: string
  ) => {
    try {
      const movementsRef = collection(db, 'tenants', tenantId, 'stockMovements');
      
      // Record outbound movement
      await addDoc(movementsRef, {
        tenantId,
        productId,
        warehouseId: fromWarehouseId,
        type: 'out',
        quantity,
        reason: `Transfer to warehouse ${toWarehouseId}`,
        timestamp: Timestamp.now(),
        createdBy: 'system'
      });

      // Record inbound movement
      await addDoc(movementsRef, {
        tenantId,
        productId,
        warehouseId: toWarehouseId,
        type: 'in',
        quantity,
        reason: `Transfer from warehouse ${fromWarehouseId}`,
        timestamp: Timestamp.now(),
        createdBy: 'system'
      });
    } catch (err) {
      console.error('Error transferring stock:', err);
      throw err;
    }
  };

  // Update inventory item
  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const itemRef = doc(db, 'tenants', tenantId, 'inventory', id);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw err;
    }
  };

  // Delete inventory item
  const deleteItem = async (id: string) => {
    try {
      const itemRef = doc(db, 'tenants', tenantId, 'inventory', id);
      await deleteDoc(itemRef);
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  };

  return {
    items,
    movements,
    loading,
    error,
    addStock,
    removeStock,
    transferStock,
    updateItem,
    deleteItem,
  };
}
