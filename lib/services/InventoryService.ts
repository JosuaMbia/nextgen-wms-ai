import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
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

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reason: string;
  referenceId?: string;
  createdAt: Date;
  createdBy: string;
}

// Helper to convert Firestore data
const convertInventoryItem = (docSnap: any): InventoryItem => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    lastRestocked: data.lastRestocked?.toDate() || new Date(),
  } as InventoryItem;
};

const convertMovement = (docSnap: any): StockMovement => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as StockMovement;
};

// Calculate status based on quantity
const calculateStatus = (
  quantity: number,
  minLevel: number,
  maxLevel: number
): InventoryItem['status'] => {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= minLevel) return 'low_stock';
  if (quantity > maxLevel) return 'overstocked';
  return 'in_stock';
};

export class InventoryService {
  /**
   * Record a stock movement
   */
  private async recordMovement(
    tenantId: string,
    data: Omit<StockMovement, 'id' | 'tenantId' | 'createdAt'>
  ): Promise<void> {
    try {
      const movementsCollection = collection(db, 'tenants', tenantId, 'stock_movements');
      await addDoc(movementsCollection, {
        ...data,
        tenantId,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error recording movement:', error);
    }
  }

  /**
   * Get all inventory items for a tenant
   */
  async getInventoryItems(tenantId: string): Promise<InventoryItem[]> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      const q = query(inventoryCollection, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(convertInventoryItem);
    } catch (error) {
      console.error('Error getting inventory items:', error);
      throw new Error('Failed to get inventory items');
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(
    tenantId: string,
    inventoryId: string
  ): Promise<InventoryItem | null> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'inventory', inventoryId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return convertInventoryItem(docSnap);
    } catch (error) {
      console.error('Error getting inventory item:', error);
      throw new Error('Failed to get inventory item');
    }
  }

  /**
   * Get inventory by warehouse
   */
  async getInventoryByWarehouse(
    tenantId: string,
    warehouseId: string
  ): Promise<InventoryItem[]> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      const q = query(
        inventoryCollection,
        where('warehouseId', '==', warehouseId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(convertInventoryItem);
    } catch (error) {
      console.error('Error getting inventory by warehouse:', error);
      throw new Error('Failed to get inventory by warehouse');
    }
  }

  /**
   * Get inventory by product
   */
  async getInventoryByProduct(
    tenantId: string,
    productId: string
  ): Promise<InventoryItem[]> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      const q = query(
        inventoryCollection,
        where('productId', '==', productId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(convertInventoryItem);
    } catch (error) {
      console.error('Error getting inventory by product:', error);
      throw new Error('Failed to get inventory by product');
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(
    tenantId: string,
    warehouseId?: string | null
  ): Promise<InventoryItem[]> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      const constraints: QueryConstraint[] = [
        where('status', 'in', ['low_stock', 'out_of_stock']),
      ];
      if (warehouseId) {
        constraints.push(where('warehouseId', '==', warehouseId));
      }
      constraints.push(orderBy('status'));
      const q = query(inventoryCollection, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(convertInventoryItem);
    } catch (error) {
      console.error('Error getting low stock items:', error);
      throw new Error('Failed to get low stock items');
    }
  }

  /**
   * Add stock to inventory
   */
  async addStock(
    tenantId: string,
    productId: string,
    quantity: number,
    warehouseId: string,
    reason: string,
    userId: string
  ): Promise<InventoryItem> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      const q = query(
        inventoryCollection,
        where('productId', '==', productId),
        where('warehouseId', '==', warehouseId),
        limit(1)
      );
      const snapshot = await getDocs(q);

      let inventoryId: string;

      if (snapshot.empty) {
        const newItem = {
          tenantId,
          productId,
          warehouseId,
          sku: `SKU-${productId}-${warehouseId}`,
          quantity,
          reservedQuantity: 0,
          availableQuantity: quantity,
          minStockLevel: 10,
          maxStockLevel: 1000,
          reorderPoint: 20,
          location: { zone: 'A', aisle: '1', rack: '1', bin: '1' },
          status: calculateStatus(quantity, 10, 1000),
          lastRestocked: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: userId,
          updatedBy: userId,
        };
        const docRef = await addDoc(inventoryCollection, newItem);
        inventoryId = docRef.id;
      } else {
        const existingDoc = snapshot.docs[0];
        inventoryId = existingDoc.id;
        const existingData = existingDoc.data();
        const newQuantity = existingData.quantity + quantity;
        const newAvailable = existingData.availableQuantity + quantity;

        await updateDoc(doc(db, 'tenants', tenantId, 'inventory', inventoryId), {
          quantity: newQuantity,
          availableQuantity: newAvailable,
          status: calculateStatus(newAvailable, existingData.minStockLevel, existingData.maxStockLevel),
          lastRestocked: Timestamp.now(),
          updatedAt: Timestamp.now(),
          updatedBy: userId,
        });
      }

      await this.recordMovement(tenantId, {
        productId,
        warehouseId,
        type: 'in',
        quantity,
        reason,
        createdBy: userId,
      });

      return (await this.getInventoryItemById(tenantId, inventoryId))!;
    } catch (error) {
      console.error('Error adding stock:', error);
      throw new Error('Failed to add stock');
    }
  }

  /**
   * Remove stock from inventory
   */
  async removeStock(
    tenantId: string,
    productId: string,
    quantity: number,
    warehouseId: string,
    reason: string,
    userId: string
  ): Promise<InventoryItem> {
    try {
      const inventoryCollection = collection(db, 'tenants', tenantId, 'inventory');
      const q = query(
        inventoryCollection,
        where('productId', '==', productId),
        where('warehouseId', '==', warehouseId),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Inventory item not found');
      }

      const existingDoc = snapshot.docs[0];
      const inventoryId = existingDoc.id;
      const existingData = existingDoc.data();

      if (existingData.availableQuantity < quantity) {
        throw new Error('Insufficient stock available');
      }

      const newQuantity = existingData.quantity - quantity;
      const newAvailable = existingData.availableQuantity - quantity;

      await updateDoc(doc(db, 'tenants', tenantId, 'inventory', inventoryId), {
        quantity: newQuantity,
        availableQuantity: newAvailable,
        status: calculateStatus(newAvailable, existingData.minStockLevel, existingData.maxStockLevel),
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      await this.recordMovement(tenantId, {
        productId,
        warehouseId,
        type: 'out',
        quantity,
        reason,
        createdBy: userId,
      });

      return (await this.getInventoryItemById(tenantId, inventoryId))!;
    } catch (error) {
      console.error('Error removing stock:', error);
      throw error;
    }
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(
    tenantId: string,
    productId: string,
    quantity: number,
    fromWarehouseId: string,
    toWarehouseId: string,
    userId: string
  ): Promise<{ from: InventoryItem; to: InventoryItem }> {
    try {
      const fromItem = await this.removeStock(
        tenantId,
        productId,
        quantity,
        fromWarehouseId,
        `Transfer to warehouse ${toWarehouseId}`,
        userId
      );

      const toItem = await this.addStock(
        tenantId,
        productId,
        quantity,
        toWarehouseId,
        `Transfer from warehouse ${fromWarehouseId}`,
        userId
      );

      await this.recordMovement(tenantId, {
        productId,
        warehouseId: fromWarehouseId,
        type: 'transfer',
        quantity,
        fromWarehouseId,
        toWarehouseId,
        reason: 'Stock transfer',
        createdBy: userId,
      });

      return { from: fromItem, to: toItem };
    } catch (error) {
      console.error('Error transferring stock:', error);
      throw error;
    }
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(
    tenantId: string,
    inventoryId: string,
    quantity: number,
    userId: string
  ): Promise<void> {
    try {
      const itemRef = doc(db, 'tenants', tenantId, 'inventory', inventoryId);
      const itemSnap = await getDoc(itemRef);

      if (!itemSnap.exists()) {
        throw new Error(`Inventory item with id ${inventoryId} not found.`);
      }

      const item = itemSnap.data() as InventoryItem;

      if (item.availableQuantity < quantity) {
        throw new Error(`Insufficient stock for item ${item.sku}. Available: ${item.availableQuantity}, Requested: ${quantity}`);
      }

      await updateDoc(itemRef, {
        reservedQuantity: item.reservedQuantity + quantity,
        availableQuantity: item.availableQuantity - quantity,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });
    } catch (error) {
      console.error('Error reserving stock:', error);
      throw error;
    }
  }

  /**
   * Release reserved stock
   */
  async releaseStock(
    tenantId: string,
    inventoryId: string,
    quantity: number,
    userId: string
  ): Promise<void> {
    try {
      const itemRef = doc(db, 'tenants', tenantId, 'inventory', inventoryId);
      const itemSnap = await getDoc(itemRef);

      if (!itemSnap.exists()) {
        throw new Error(`Inventory item with id ${inventoryId} not found.`);
      }

      const item = itemSnap.data() as InventoryItem;

      if (item.reservedQuantity < quantity) {
        throw new Error(`Not enough reserved stock for item ${item.sku}. Reserved: ${item.reservedQuantity}, Requested to release: ${quantity}`);
      }

      await updateDoc(itemRef, {
        reservedQuantity: item.reservedQuantity - quantity,
        availableQuantity: item.availableQuantity + quantity,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });
    } catch (error) {
      console.error('Error releasing stock:', error);
      throw error;
    }
  }

  /**
   * Get stock movements
   */
  async getStockMovements(
    tenantId: string,
    warehouseId?: string | null,
    productId?: string | null
  ): Promise<StockMovement[]> {
    try {
      const movementsCollection = collection(db, 'tenants', tenantId, 'stock_movements');
      const constraints: QueryConstraint[] = [];

      if (warehouseId) {
        constraints.push(where('warehouseId', '==', warehouseId));
      }
      if (productId) {
        constraints.push(where('productId', '==', productId));
      }
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(100));

      const q = query(movementsCollection, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(convertMovement);
    } catch (error) {
      console.error('Error getting stock movements:', error);
      throw new Error('Failed to get stock movements');
    }
  }

  // The methods from the "new" service file seemed incomplete or were using a different DB model.
  // I have excluded them in favor of the more complete logic from the old file.
  // If reserveStock, releaseStock, etc. are needed, they must be implemented following the
  // '/tenants/{tenantId}/inventory' DB structure and using the more detailed InventoryItem interface.

}
