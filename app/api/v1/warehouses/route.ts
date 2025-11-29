import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/lib/services/WarehouseService';
import { z } from 'zod';

// Operating hours schema for a single day
const DayHoursSchema = z.object({
  open: z.string(),
  close: z.string()
});

// Validation schema for warehouse creation - matches Warehouse interface
const WarehouseCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),
  capacity: z.object({
    totalArea: z.number().positive('Total area must be positive'),
    usedArea: z.number().nonnegative('Used area cannot be negative'),
    zones: z.number().int().nonnegative()
  }),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  manager: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string()
  }),
  operatingHours: z.object({
    monday: DayHoursSchema,
    tuesday: DayHoursSchema,
    wednesday: DayHoursSchema,
    thursday: DayHoursSchema,
    friday: DayHoursSchema,
    saturday: DayHoursSchema,
    sunday: DayHoursSchema
  })
});

const WarehouseUpdateSchema = WarehouseCreateSchema.partial();

// GET /api/v1/warehouses - List all warehouses for a tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      status: searchParams.get('status') as 'active' | 'inactive' | 'maintenance' | undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    };

    const warehouses = await warehouseService.listWarehouses(tenantId, filters);

    return NextResponse.json({
      success: true,
      data: warehouses,
      count: warehouses.length
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

// POST /api/v1/warehouses - Create a new warehouse
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const userId = request.headers.get('x-user-id') || 'api-user';

    const body = await request.json();
    const validatedData = WarehouseCreateSchema.parse(body);

    const warehouse = await warehouseService.createWarehouse(
      tenantId,
      validatedData,
      userId
    );

    return NextResponse.json({
      success: true,
      data: warehouse,
      message: 'Warehouse created successfully'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/warehouses - Update a warehouse
export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const userId = request.headers.get('x-user-id') || 'api-user';
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('id');

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'Warehouse ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = WarehouseUpdateSchema.parse(body);

    const warehouse = await warehouseService.updateWarehouse(
      tenantId,
      warehouseId,
      validatedData,
      userId
    );

    return NextResponse.json({
      success: true,
      data: warehouse,
      message: 'Warehouse updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/warehouses - Delete a warehouse
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('id');

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'Warehouse ID is required' },
        { status: 400 }
      );
    }

    await warehouseService.deleteWarehouse(tenantId, warehouseId);

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}
