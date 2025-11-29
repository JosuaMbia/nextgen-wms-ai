hooks/useWarehouses.ts'use client';

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
import { Warehouse } from '@/lib/services/WarehouseService';

export interface UseWarehousesOptions {
  tenantId: string;
  status?: string;
  realtime?: boolean;
}

export function useWarehouses(options: UseWarehousesOptions) {
  const { tenantId, status, realtime = true } = options;
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const warehousesRef = collection(db, 'tenants', tenantId, 'warehouses');
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    const q = query(warehousesRef, ...constraints);

    // Real-time listener - Le système s'auto-met à jour!
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Warehouse[];
        
        setWarehouses(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId, status]);

  // Fonction autonome pour créer un warehouse - Pas d'API!
  const createWarehouse = async (data: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const warehousesRef = collection(db, 'tenants', tenantId, 'warehouses');
      await addDoc(warehousesRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      // Pas besoin de mettre à jour l'état - le listener le fait automatiquement!
    } catch (err) {
      console.error('Error creating warehouse:', err);
      throw err;
    }
  };

  // Fonction autonome pour update
  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    try {
      const warehouseRef = doc(db, 'tenants', tenantId, 'warehouses', id);
      await updateDoc(warehouseRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating warehouse:', err);
      throw err;
    }
  };

  // Fonction autonome pour delete
  const deleteWarehouse = async (id: string) => {
    try {
      const warehouseRef = doc(db, 'tenants', tenantId, 'warehouses', id);
      await deleteDoc(warehouseRef);
    } catch (err) {
      console.error('Error deleting warehouse:', err);
      throw err;
    }
  };

  return {
    warehouses,
    loading,
    error,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };
}
