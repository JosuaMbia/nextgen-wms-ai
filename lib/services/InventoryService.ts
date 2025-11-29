import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, Timestamp, QueryConstraint
} from 'firebase/firestore';

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
}

export class InventoryService {
  async getInventory(tenantId: string): Promise<InventoryItem[]> {
    const q = query(collection(db, 'inventory'), where('tenantId', '==', tenantId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as InventoryItem);
  }

  async reserveStock(itemId: string, quantity: number): Promise<void> {
    const ref = doc(db, 'inventory', itemId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Item not found');
    const item = snap.data() as InventoryItem;
    if (item.availableQuantity < quantity) throw new Error('Insufficient stock');
    await updateDoc(ref, {
      reservedQuantity: item.reservedQuantity + quantity,
      availableQuantity: item.availableQuantity - quantity,
    });
  }

  async releaseStock(itemId: string, quantity: number): Promise<void> {
    const ref = doc(db, 'inventory', itemId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Item not found');
    const item = snap.data() as InventoryItem;
    if (item.reservedQuantity < quantity) throw new Error('Not enough reserved');
    await updateDoc(ref, {
      reservedQuantity: item.reservedQuantity - quantity,
      availableQuantity: item.availableQuantity + quantity,
    });
  }

  async receiveStock(item: InventoryItem, quantity: number): Promise<void> {
    const ref = doc(db, 'inventory', item.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Item not found');
    await updateDoc(ref, {
      quantity: item.quantity + quantity,
      availableQuantity: item.availableQuantity + quantity,
    });
  }

  async transferStock(itemId: string, targetWarehouseId: string, quantity: number): Promise<void> {
    const ref = doc(db, 'inventory', itemId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Item not found');
    const item = snap.data() as InventoryItem;
    if (item.availableQuantity < quantity) throw new Error('Insufficient stock');
    await updateDoc(ref, {
      availableQuantity: item.availableQuantity - quantity,
    });
    // Compléter la logique de transfert réel (ajouter dans target warehouse)
  }
}
