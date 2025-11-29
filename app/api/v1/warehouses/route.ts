import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/lib/services/WarehouseService';
import { z } from 'zod';

// Validation schema for warehouse creation
const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  location: z.string().min(1, 'Location is required'),
  capacity: z.object({
    totalArea: z.number().positive('Total area must be positive'),
    usedArea: z.number().nonnegative('Used area cannot be negative'),
    unit: z.enum(['sqm', 'sqft']),
  }),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  contactPerson: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
});

// GET /api/v1/warehouses - List all warehouses for a tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');

    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (limitParam) filters.limit = parseInt(limitParam);

    const warehouses = await warehouseService.listWarehouses(tenantId, filters);

    return NextResponse.json({
      success: true,
      data: warehouses,
      count: warehouses.length,
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

// POST /api/v1/warehouses - Create a new warehouse
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = warehouseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      );
    }

    const warehouseData = {
      ...validation.data,
      tenantId,
      status: validation.data.status || 'active',
    };

    const warehouse = await warehouseService.createWarehouse(
      tenantId,
      warehouseData,
      userId
    );

    return NextResponse.json(
      {
        success: true,
        data: warehouse,
        message: 'Warehouse created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
