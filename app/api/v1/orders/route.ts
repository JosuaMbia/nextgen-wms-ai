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
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  items: z.array(OrderItemSchema).min(1),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  notes: z.string().optional()
});

// Status update schema
const StatusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'picking', 'packing', 'shipped', 'delivered', 'cancelled']),
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
    const priority = searchParams.get('priority');

    // Build filters for listOrders
    const filters: Record<string, any> = {};
    if (customerId) filters.customerId = customerId;
    if (status) filters.status = status;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (priority) filters.priority = priority;

    const data = await orderService.listOrders(tenantId, filters);

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

    const order = await orderService.createOrder(tenantId, validatedData as any, 'api-user');

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order
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

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = StatusUpdateSchema.parse(body);

    const order = await orderService.updateOrderStatus(tenantId, orderId, status, 'api-user');

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
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
