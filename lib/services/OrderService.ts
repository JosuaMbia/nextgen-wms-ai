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
import { InventoryService } from './InventoryService';

// Types

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'picking' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warehouseId?: string;
  inventoryId?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'processing' | 'picking' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  totalAmount: number;
  currency: string;
  notes?: string;
    warehouseId?: string;
  trackingNumber?: string;
  carrierService?: string;
  assignedWarehouseId?: string;
  orderDate: Date;
  confirmedDate?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  cancelledDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
    statusHistory?: Array<{status: OrderStatus; timestamp: Date; notes?: string; updatedBy: string}>;
}

export interface OrderFilters {
  status?: string;
  priority?: string;
  customerId?: string;
  warehouseId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

class OrderService {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }
  
  /**
   * Generate unique order number
   */
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const ordersCollection = collection(db, 'tenants', tenantId, 'orders');
    const q = query(ordersCollection, orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastOrder = snapshot.docs[0].data();
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    return `ORD-${nextNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Create new order
   */
  async createOrder(
    tenantId: string,
    data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'orderDate'>,
    userId: string
  ): Promise<Order> {
    try {
      const ordersCollection = collection(db, 'tenants', tenantId, 'orders');
      const orderNumber = await this.generateOrderNumber(tenantId);

      const orderData = {
        ...data,
        orderNumber,
        orderDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
        updatedBy: userId,
      };

      const docRef = await addDoc(ordersCollection, orderData);
      const newDoc = await getDoc(docRef);
      const savedData = newDoc.data();

      return {
        id: newDoc.id,
        ...savedData,
        orderDate: savedData?.orderDate.toDate(),
        createdAt: savedData?.createdAt.toDate(),
        updatedAt: savedData?.updatedAt.toDate(),
        confirmedDate: savedData?.confirmedDate?.toDate(),
        shippedDate: savedData?.shippedDate?.toDate(),
        deliveredDate: savedData?.deliveredDate?.toDate(),
        cancelledDate: savedData?.cancelledDate?.toDate(),
      } as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(tenantId: string, orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'orders', orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        orderDate: data.orderDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        confirmedDate: data.confirmedDate?.toDate(),
        shippedDate: data.shippedDate?.toDate(),
        deliveredDate: data.deliveredDate?.toDate(),
        cancelledDate: data.cancelledDate?.toDate(),
      } as Order;
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  /**
   * List orders with filters
   */
  async listOrders(tenantId: string, filters: OrderFilters = {}): Promise<Order[]> {
    try {
      const ordersCollection = collection(db, 'tenants', tenantId, 'orders');
      const constraints: QueryConstraint[] = [];

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.priority) {
        constraints.push(where('priority', '==', filters.priority));
      }

      if (filters.customerId) {
        constraints.push(where('customerId', '==', filters.customerId));
      }

      if (filters.warehouseId) {
        constraints.push(where('assignedWarehouseId', '==', filters.warehouseId));
      }

      if (filters.search) {
        constraints.push(where('orderNumber', '>=', filters.search));
        constraints.push(where('orderNumber', '<=', filters.search + '\uf8ff'));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(ordersCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          orderDate: data.orderDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          confirmedDate: data.confirmedDate?.toDate(),
          shippedDate: data.shippedDate?.toDate(),
          deliveredDate: data.deliveredDate?.toDate(),
          cancelledDate: data.cancelledDate?.toDate(),
        } as Order;
      });
    } catch (error) {
      console.error('Error listing orders:', error);
      throw new Error('Failed to list orders');
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    tenantId: string,
    orderId: string,
    newStatus: Order['status'],
    userId: string
  ): Promise<Order> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'orders', orderId);
      const updates: Record<string, unknown> = {
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      };

      // Update status-specific timestamps and inventory
      if (newStatus === 'confirmed') {
        updates.confirmedDate = Timestamp.now();
        // Reserve inventory for the order
        const order = await this.getOrder(tenantId, orderId);
        if (order) {
          for (const item of order.items) {
            if (item.inventoryId) {
              await this.inventoryService.reserveStock(tenantId, item.inventoryId, item.quantity, userId);
            }
          }
        }
      } else if (newStatus === 'shipped') {
        updates.shippedDate = Timestamp.now();
      } else if (newStatus === 'delivered') {
        updates.deliveredDate = Timestamp.now();
      } else if (newStatus === 'cancelled') {
        updates.cancelledDate = Timestamp.now();
        // Release reserved inventory
        const order = await this.getOrder(tenantId, orderId);
        if (order) {
          for (const item of order.items) {
            if (item.inventoryId) {
              await this.inventoryService.releaseStock(tenantId, item.inventoryId, item.quantity, userId);
            }
          }
        }
      }

      await updateDoc(docRef, updates);
      return await this.getOrder(tenantId, orderId) as Order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(tenantId: string): Promise<OrderStats> {
    try {
      const ordersCollection = collection(db, 'tenants', tenantId, 'orders');
      const querySnapshot = await getDocs(ordersCollection);

      let totalOrders = 0;
      let pendingOrders = 0;
      let processingOrders = 0;
      let shippedOrders = 0;
      let deliveredOrders = 0;
      let cancelledOrders = 0;
      let totalRevenue = 0;
      let totalAmount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalOrders++;

        if (data.status === 'pending') pendingOrders++;
        if (data.status === 'processing' || data.status === 'picking' || data.tatus === 'packing') processingOrders++;
        if (data.status === 'shipped') shippedOrders++;
        if (data.status === 'delivered') deliveredOrders++;
        if (data.status === 'cancelled') cancelledOrders++;

        if (data.status !== 'cancelled') {
          totalRevenue += data.totalAmount || 0;
        }
        totalAmount += data.totalAmount || 0;
      });

      return {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0,
      };
    } catch (error) {
      console.error('Error getting order stats:', error);
      throw new Error('Failed to get order stats');
    }
  }

  /**
   * Assign warehouse to order
   */
  async assignWarehouse(
    tenantId: string,
    orderId: string,
    warehouseId: string,
    userId: string
  ): Promise<Order> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'orders', orderId);

      await updateDoc(docRef, {
        assignedWarehouseId: warehouseId,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      return await this.getOrder(tenantId, orderId) as Order;
    } catch (error) {
      console.error('Error assigning warehouse:', error);
      throw new Error('Failed to assign warehouse');
    }
  }

  /**
   * Update tracking information
   */
  async updateTracking(
    tenantId: string,
    orderId: string,
    trackingNumber: string,
    carrierService: string,
    userId: string
  ): Promise<Order> {
    try {
      const docRef = doc(db, 'tenants', tenantId, 'orders', orderId);

      await updateDoc(docRef, {
        trackingNumber,
        carrierService,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      return await this.getOrder(tenantId, orderId) as Order;
    } catch (error) {
      console.error('Error updating tracking:', error);
      throw new Error('Failed to update tracking');
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    tenantId: string,
    orderId: string,
    userId: string
  ): Promise<Order> {
    try {
      return await this.updateOrderStatus(tenantId, orderId, 'cancelled', userId);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order');
    }
  }
}

// Export singleton instance
export const orderService = new OrderService();
