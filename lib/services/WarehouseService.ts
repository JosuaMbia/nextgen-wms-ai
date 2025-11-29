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
export interface Warehouse {
  id?: string;
  tenantId: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  capacity: {
    totalArea: number; // m²
    usedArea: number;
    zones: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  manager: {
    name: string;
    email: string;
    phone: string;
  };
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  };
}

export interface WarehouseFilters {
  status?: 'active' | 'inactive' | 'maintenance';
  search?: string;
  limit?: number;
}

export class WarehouseService {
  private collectionName = 'warehouses';

  /**
   * Get warehouses collection reference for a tenant
   */
  private getCollection(tenantId: string) {
    return collection(db, 'tenants', tenantId, this.collectionName);
  }

  /**
   * Create a new warehouse
   */
  async createWarehouse(
    tenantId: string,
    warehouseData: Omit<Warehouse, 'id' | 'metadata'>,
    userId: string
  ): Promise<Warehouse> {
    try {
      const now = new Date();
      const newWarehouse = {
        ...warehouseData,
        tenantId,
        metadata: {
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
          createdBy: userId,
          updatedBy: userId,
        },
      };

      const docRef = await addDoc(
        this.getCollection(tenantId),
        newWarehouse
      );

      return {
        ...warehouseData,
        id: docRef.id,
        metadata: {
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
        },
      };
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw new Error('Failed to create warehouse');
    }
  }

  /**
   * Get warehouse by ID
   */
  async getWarehouse(
    tenantId: string,
    warehouseId: string
  ): Promise<Warehouse | null> {
    try {
      const docRef = doc(this.getCollection(tenantId), warehouseId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        metadata: {
          createdAt: data.metadata.createdAt.toDate(),
          updatedAt: data.metadata.updatedAt.toDate(),
          createdBy: data.metadata.createdBy,
          updatedBy: data.metadata.updatedBy,
        },
      } as Warehouse;
    } catch (error) {
      console.error('Error getting warehouse:', error);
      throw new Error('Failed to get warehouse');
    }
  }

  /**
   * List warehouses with filters
   */
  async listWarehouses(
    tenantId: string,
    filters?: WarehouseFilters
  ): Promise<Warehouse[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.search) {
        constraints.push(
          where('name', '>=', filters.search),
          where('name', '<=', filters.search + '\uf8ff')
        );
      }

      constraints.push(orderBy('metadata.createdAt', 'desc'));

      if (filters?.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(this.getCollection(tenantId), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          metadata: {
            createdAt: data.metadata.createdAt.toDate(),
            updatedAt: data.metadata.updatedAt.toDate(),
            createdBy: data.metadata.createdBy,
            updatedBy: data.metadata.updatedBy,
          },
        } as Warehouse;
      });
    } catch (error) {
      console.error('Error listing warehouses:', error);
      throw new Error('Failed to list warehouses');
    }
  }

  /**
   * Update warehouse
   */
  async updateWarehouse(
    tenantId: string,
    warehouseId: string,
    updates: Partial<Omit<Warehouse, 'id' | 'tenantId' | 'metadata'>>,
    userId: string
  ): Promise<Warehouse> {
    try {
      const docRef = doc(this.getCollection(tenantId), warehouseId);
      const now = new Date();

      const updateData = {
        ...updates,
        'metadata.updatedAt': Timestamp.fromDate(now),
        'metadata.updatedBy': userId,
      };

      await updateDoc(docRef, updateData);

      const updatedDoc = await this.getWarehouse(tenantId, warehouseId);
      if (!updatedDoc) {
        throw new Error('Warehouse not found after update');
      }

      return updatedDoc;
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw new Error('Failed to update warehouse');
    }
  }

  /**
   * Delete warehouse
   */
  async deleteWarehouse(
    tenantId: string,
    warehouseId: string
  ): Promise<void> {
    try {
      const docRef = doc(this.getCollection(tenantId), warehouseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      throw new Error('Failed to delete warehouse');
    }
  }

  /**
   * Get warehouse statistics
   */
  async getWarehouseStats(tenantId: string, warehouseId: string) {
    try {
      const warehouse = await this.getWarehouse(tenantId, warehouseId);
      if (!warehouse) {
        throw new Error('Warehouse not found');
      }

      const utilizationRate =
        (warehouse.capacity.usedArea / warehouse.capacity.totalArea) * 100;

      return {
        warehouseId,
        name: warehouse.name,
        totalArea: warehouse.capacity.totalArea,
        usedArea: warehouse.capacity.usedArea,
        availableArea: warehouse.capacity.totalArea - warehouse.capacity.usedArea,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        zones: warehouse.capacity.zones,
        status: warehouse.status,
      };
    } catch (error) {
      console.error('Error getting warehouse stats:', error);
      throw new Error('Failed to get warehouse statistics');
    }
  }

  /**
   * Update warehouse capacity
   */
  async updateCapacity(
    tenantId: string,
    warehouseId: string,
    capacityUpdate: { usedArea?: number; zones?: number },
    userId: string
  ): Promise<Warehouse> {
    try {
      const warehouse = await this.getWarehouse(tenantId, warehouseId);
      if (!warehouse) {
        throw new Error('Warehouse not found');
      }

      const updatedCapacity = {
        ...warehouse.capacity,
        ...capacityUpdate,
      };

      // Validate that used area doesn't exceed total area
      if (updatedCapacity.usedArea > updatedCapacity.totalArea) {
        throw new Error('Used area cannot exceed total area');
      }

      return await this.updateWarehouse(
        tenantId,
        warehouseId,
        { capacity: updatedCapacity },
        userId
      );
    } catch (error) {
      console.error('Error updating warehouse capacity:', error);
      throw new Error('Failed to update warehouse capacity');
    }
  }

  /**
   * Change warehouse status
   */
  async changeStatus(
    tenantId: string,
    warehouseId: string,
    newStatus: 'active' | 'inactive' | 'maintenance',
    userId: string
  ): Promise<Warehouse> {
    try {
      return await this.updateWarehouse(
        tenantId,
        warehouseId,
        { status: newStatus },
        userId
      );
    } catch (error) {
      console.error('Error changing warehouse status:', error);
      throw new Error('Failed to change warehouse status');
    }
  }
}

// Export singleton instance
export const warehouseService = new WarehouseService();
