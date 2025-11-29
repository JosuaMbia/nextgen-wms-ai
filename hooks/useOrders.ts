'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus } from '@/lib/services/OrderService';

export interface UseOrdersOptions {
  tenantId: string;
  customerId?: string;
  status?: OrderStatus;
  warehouseId?: string;
  realtime?: boolean;
}

export interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  createOrder: (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, notes?: string) => Promise<void>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
  getOrdersByCustomer: (customerId: string) => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
}

export function useOrders(options: UseOrdersOptions): UseOrdersResult {
  const { tenantId, customerId, status, warehouseId, realtime = true } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Real-time listener for orders
  useEffect(() => {
    if (!realtime) return;

    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        orderBy('orderDate', 'desc')
      ];

      if (customerId) {
        constraints.push(where('customerId', '==', customerId));
      }
      if (status) {
        constraints.push(where('status', '==', status));
      }
      if (warehouseId) {
        constraints.push(where('warehouseId', '==', warehouseId));
      }

      const ordersRef = collection(db, 'tenants', tenantId, 'orders');
      const q = query(ordersRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Order[];
          setOrders(ordersData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching orders:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up orders listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [tenantId, customerId, status, warehouseId, realtime]);

  // Create order function
  const createOrder = async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    try {
      const ordersRef = collection(db, 'tenants', tenantId, 'orders');
      
      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      await addDoc(ordersRef, {
        ...data,
        tenantId,
        status: 'pending' as OrderStatus,
        totalAmount,
        orderDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'system',
        updatedBy: 'system'
      });
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  // Update order status function with automatic inventory integration
  const updateOrderStatus = async (id: string, newStatus: OrderStatus, notes?: string) => {
    try {
      const orderRef = doc(db, 'tenants', tenantId, 'orders', id);
      const order = orders.find(o => o.id === id);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate status transition
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
            'picking': ['packing', 'cancelled'],
            'packing': ['shipped', 'cancelled'],
        'shipped': ['delivered', 'returned'],
        'delivered': ['returned'],
        'cancelled': [],
        'returned': []
      };

      if (!validTransitions[order.status].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }

      // Update order with status history
      const statusHistory = order.statusHistory || [];
      statusHistory.push({
        status: newStatus,
        timestamp: Timestamp.now().toDate(),
        notes: notes || '',
        updatedBy: 'system'
      });

      await updateDoc(orderRef, {
        status: newStatus,
        statusHistory,
        updatedAt: Timestamp.now(),
        updatedBy: 'system'
      });

      // Trigger inventory updates for specific status changes
      if (newStatus === 'confirmed') {
        // Reserve inventory
        for (const item of order.items) {
          const movementsRef = collection(db, 'tenants', tenantId, 'stockMovements');
          await addDoc(movementsRef, {
            tenantId,
            productId: item.productId,
            warehouseId: order.warehouseId,
            type: 'reserved',
            quantity: item.quantity,
            reason: `Order ${order.orderNumber} confirmed`,
            timestamp: Timestamp.now().toDate(),
            createdBy: 'system'
          });
        }
      } else if (newStatus === 'shipped') {
        // Remove from inventory
        for (const item of order.items) {
          const movementsRef = collection(db, 'tenants', tenantId, 'stockMovements');
          await addDoc(movementsRef, {
            tenantId,
            productId: item.productId,
            warehouseId: order.warehouseId,
            type: 'out',
            quantity: item.quantity,
            reason: `Order ${order.orderNumber} shipped`,
            timestamp: Timestamp.now().toDate(),
            createdBy: 'system'
          });
        }
      } else if (newStatus === 'cancelled') {
        // Release reserved inventory
        for (const item of order.items) {
          const movementsRef = collection(db, 'tenants', tenantId, 'stockMovements');
          await addDoc(movementsRef, {
            tenantId,
            productId: item.productId,
            warehouseId: order.warehouseId,
            type: 'in',
            quantity: item.quantity,
            reason: `Order ${order.orderNumber} cancelled - reservation released`,
            timestamp: Timestamp.now().toDate(),
            createdBy: 'system'
          });
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  // Cancel order function
  const cancelOrder = async (id: string, reason: string) => {
    try {
      await updateOrderStatus(id, 'cancelled', reason);
    } catch (err) {
      console.error('Error cancelling order:', err);
      throw err;
    }
  };

  // Get orders by customer
  const getOrdersByCustomer = (customerId: string): Order[] => {
    return orders.filter(order => order.customerId === customerId);
  };

  // Get orders by status
  const getOrdersByStatus = (status: OrderStatus): Order[] => {
    return orders.filter(order => order.status === status);
  };

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrdersByCustomer,
    getOrdersByStatus,
  };
}
