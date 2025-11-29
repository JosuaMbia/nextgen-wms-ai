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
  increment,
} from 'firebase/firestore';

// Types
export interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  location: {
    zone: string;
    aisle: string;
    rack: string;
    bin: string;
  };
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface InventoryMovement {
  id: string;
  tenantId: string;
  inventoryId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reason: string;
  referenceId?: string;
  referenceType?: 'order' | 'shipment' | 'return' | 'adjustment';
  createdAt: Date;
  createdBy: string;
}

export interface InventoryFilters {
  warehouseId?: string;
  productId?: string;
  status?: string;
  lowStock?: boolean;
  search?: string;
  limit?: number;
}

export interface StockAlert {
  inventoryId: string;
  productId: string;
  warehouseId: string;
  currentStock: number;
  threshold: number;
  alertType: 'low_stock' | 'out_of_stock' | 'overstocked';
}

class InventoryService {
  /**
   * Create new inventory item
   */
  async createInventory(
    tenantId: string,
    data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'availableQuantity' | 'status'>,
    userId: string
  ): Promise<InventoryItem> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      
      const availableQuantity = data.quantity - data.reservedQuantity;
      let status: InventoryItem['status'] = 'in_stock';
      
      if (availableQuantity === 0) {
        status = 'out_of_stock';
      } else if (availableQuantity <= data.minStockLevel) {
        status = 'low_stock';
      } else if (availableQuantity > data.maxStockLevel) {
        status = 'overstocked';
      }

      const inventoryData = {
        ...data,
        availableQuantity,
        status,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastRestocked: Timestamp.now(),
        createdBy: userId,
        updatedBy: userId,
      };

      const docRef = await addDoc(inventoryCollection, inventoryData);
      const newDoc = await getDoc(docRef);

      return {
        id: newDoc.id,
        ...inventoryData,
        createdAt: inventoryData.createdAt.toDate(),
        updatedAt: inventoryData.updatedAt.toDate(),
        lastRestocked: inventoryData.lastRestocked.toDate(),
      } as InventoryItem;
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw new Error('Failed to create inventory');
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventory(tenantId: string, inventoryId: string): Promise<InventoryItem | null> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'inventory', inventoryId);
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
        lastRestocked: data.lastRestocked.toDate(),
      } as InventoryItem;
    } catch (error) {
      console.error('Error getting inventory:', error);
      throw new Error('Failed to get inventory');
    }
  }

  /**
   * List inventory items with filters
   */
  async listInventory(tenantId: string, filters: InventoryFilters = {}): Promise<InventoryItem[]> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      const constraints: QueryConstraint[] = [];

      if (filters.warehouseId) {
        constraints.push(where('warehouseId', '==', filters.warehouseId));
      }

      if (filters.productId) {
        constraints.push(where('productId', '==', filters.productId));
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.lowStock) {
        constraints.push(where('status', 'in', ['low_stock', 'out_of_stock']));
      }

      if (filters.search) {
        constraints.push(where('sku', '>=', filters.search));
        constraints.push(where('sku', '<=', filters.search + '\uf8ff'));
      }

      constraints.push(orderBy('updatedAt', 'desc'));

      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(inventoryCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastRestocked: data.lastRestocked.toDate(),
        } as InventoryItem;
      });
    } catch (error) {
      console.error('Error listing inventory:', error);
      throw new Error('Failed to list inventory');
    }
  }

  /**
   * Update stock quantity
   */
  async updateStock(
    tenantId: string,
    inventoryId: string,
    quantityChange: number,
    userId: string
  ): Promise<InventoryItem> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'inventory', inventoryId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Inventory item not found');
      }

      const currentData = docSnap.data();
      const newQuantity = currentData.quantity + quantityChange;
      const newAvailableQuantity = newQuantity - currentData.reservedQuantity;

      let status: InventoryItem['status'] = 'in_stock';
      if (newAvailableQuantity === 0) {
        status = 'out_of_stock';
      } else if (newAvailableQuantity <= currentData.minStockLevel) {
        status = 'low_stock';
      } else if (newAvailableQuantity > currentData.maxStockLevel) {
        status = 'overstocked';
      }

      await updateDoc(docRef, {
        quantity: newQuantity,
        availableQuantity: newAvailableQuantity,
        status,
        lastRestocked: quantityChange > 0 ? Timestamp.now() : currentData.lastRestocked,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      return await this.getInventory(tenantId, inventoryId) as InventoryItem;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw new Error('Failed to update stock');
    }
  }

  /**
   * Record inventory movement
   */
  async recordMovement(
    tenantId: string,
    data: Omit<InventoryMovement, 'id' | 'createdAt'>,
    userId: string
  ): Promise<InventoryMovement> {
    try {
      const movementsCollection = collection(db, 'tenants', tenantId, 'inventory_movements');

      const movementData = {
        ...data,
        createdAt: Timestamp.now(),
        createdBy: userId,
      };

      const docRef = await addDoc(movementsCollection, movementData);
      const newDoc = await getDoc(docRef);
      const savedData = newDoc.data();

      // Update inventory quantity based on movement type
      if (data.type === 'in') {
        await this.updateStock(tenantId, data.inventoryId, data.quantity, userId);
      } else if (data.type === 'out' || data.type === 'adjustment') {
        await this.updateStock(tenantId, data.inventoryId, -data.quantity, userId);
      }

      return {
        id: newDoc.id,
        ...savedData,
        createdAt: savedData.createdAt.toDate(),
      } as InventoryMovement;
    } catch (error) {
      console.error('Error recording movement:', error);
      throw new Error('Failed to record movement');
    }
  }

  /**
   * Get stock alerts
   */
  async getStockAlerts(tenantId: string): Promise<StockAlert[]> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      const constraints: QueryConstraint[] = [
        where('status', 'in', ['low_stock', 'out_of_stock', 'overstocked']),
        orderBy('status'),
      ];

      const q = query(inventoryCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        let alertType: StockAlert['alertType'] = 'low_stock';
        let threshold = data.minStockLevel;

        if (data.status === 'out_of_stock') {
          alertType = 'out_of_stock';
          threshold = 0;
        } else if (data.status === 'overstocked') {
          alertType = 'overstocked';
          threshold = data.maxStockLevel;
        }

        return {
          inventoryId: doc.id,
          productId: data.productId,
          warehouseId: data.warehouseId,
          currentStock: data.availableQuantity,
          threshold,
          alertType,
        };
      });
    } catch (error) {
      console.error('Error getting stock alerts:', error);
      throw new Error('Failed to get stock alerts');
    }
  }

  /**
   * Get inventory movements history
   */
  async getMovementHistory(
    tenantId: string,
    inventoryId: string,
    limitCount: number = 50
  ): Promise<InventoryMovement[]> {
    try {
      const movementsCollection = collection(db, 'tenants', tenantId, 'inventory_movements');
      const constraints: QueryConstraint[] = [
        where('inventoryId', '==', inventoryId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ];

      const q = query(movementsCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as InventoryMovement;
      });
    } catch (error) {
      console.error('Error getting movement history:', error);
      throw new Error('Failed to get movement history');
    }
  }

  /**
   * Reserve inventory quantity
   */
  async reserveStock(
    tenantId: string,
    inventoryId: string,
    quantity: number,
    userId: string
  ): Promise<InventoryItem> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'inventory', inventoryId);

      await updateDoc(docRef, {
        reservedQuantity: increment(quantity),
        availableQuantity: increment(-quantity),
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      return await this.getInventory(tenantId, inventoryId) as InventoryItem;
    } catch (error) {
      console.error('Error reserving stock:', error);
      throw new Error('Failed to reserve stock');
    }
  }

  /**
   * Release reserved inventory
   */
  async releaseStock(
    tenantId: string,
    inventoryId: string,
    quantity: number,
    userId: string
  ): Promise<InventoryItem> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'inventory', inventoryId);

      await updateDoc(docRef, {
        reservedQuantity: increment(-quantity),
        availableQuantity: increment(quantity),
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      return await this.getInventory(tenantId, inventoryId) as InventoryItem;
    } catch (error) {
      console.error('Error releasing stock:', error);
      throw new Error('Failed to release stock');
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
