import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { orderService } from '@/lib/services/OrderService';

// Order item schema
const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0)
});

// Order create schema
const OrderCreateSchema = z.object({
  orderNumber: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  warehouseId: z.string().min(1),
  items: z.array(OrderItemSchema).min(1),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),
  notes: z.string().optional()
});

// Status update schema
const StatusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
  notes: z.string().optional()
});

// GET /api/v1/orders - List orders with filters
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');

    let data;

    if (customerId) {
      data = await orderService.getOrdersByCustomer(tenantId, customerId);
    } else if (status) {
      data = await orderService.getOrdersByStatus(tenantId, status as any);
    } else {
      data = await orderService.getOrders(tenantId, warehouseId, status as any);
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error in GET /api/v1/orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/orders - Create order
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = OrderCreateSchema.parse(body);

    const orderId = await orderService.createOrder(tenantId, validatedData as any, 'api-user');

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: { id: orderId }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/v1/orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/orders - Update order status
export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');
    const action = searchParams.get('action');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (action === 'cancel') {
      const { reason } = body;
      await orderService.cancelOrder(tenantId, orderId, reason || 'Cancelled via API', 'api-user');
      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    }

    const { status, notes } = StatusUpdateSchema.parse(body);
    await orderService.updateOrderStatus(tenantId, orderId, status, notes, 'api-user');

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/v1/orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
