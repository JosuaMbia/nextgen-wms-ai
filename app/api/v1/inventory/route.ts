import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getInventoryItems,
  addStock,
  removeStock,
  transferStock,
  getStockMovements,
  getInventoryByWarehouse,
  getInventoryByProduct,
  getLowStockItems
} from '@/lib/services/InventoryService';

// Validation schema for inventory operations
const StockOperationSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  warehouseId: z.string().min(1),
  reason: z.string().min(1)
});

const StockTransferSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1)
});

// GET /api/v1/inventory - List inventory items with filters
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
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const lowStockOnly = searchParams.get('lowStock') === 'true';
    const movements = searchParams.get('movements') === 'true';

    let data;

    if (movements) {
      // Get stock movements
      data = await getStockMovements(tenantId, warehouseId, productId);
    } else if (lowStockOnly) {
      // Get low stock items
      data = await getLowStockItems(tenantId, warehouseId);
    } else if (warehouseId) {
      // Get inventory by warehouse
      data = await getInventoryByWarehouse(tenantId, warehouseId);
    } else if (productId) {
      // Get inventory by product
      data = await getInventoryByProduct(tenantId, productId);
    } else {
      // Get all inventory items
      data = await getInventoryItems(tenantId);
    }

    return NextResponse.json({
      success: true,
      data,
      count: Array.isArray(data) ? data.length : 1
    });
  } catch (error) {
    console.error('Error in GET /api/v1/inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/inventory - Stock operations (add/remove/transfer)
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
    const { operation } = body;

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation type is required (add, remove, or transfer)' },
        { status: 400 }
      );
    }

    let result;

    switch (operation) {
      case 'add':
        const addData = StockOperationSchema.parse(body);
        result = await addStock(
          tenantId,
          addData.productId,
          addData.quantity,
          addData.warehouseId,
          addData.reason,
          'api-user'
        );
        break;

      case 'remove':
        const removeData = StockOperationSchema.parse(body);
        result = await removeStock(
          tenantId,
          removeData.productId,
          removeData.quantity,
          removeData.warehouseId,
          removeData.reason,
          'api-user'
        );
        break;

      case 'transfer':
        const transferData = StockTransferSchema.parse(body);
        result = await transferStock(
          tenantId,
          transferData.productId,
          transferData.quantity,
          transferData.fromWarehouseId,
          transferData.toWarehouseId,
          'api-user'
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Stock ${operation} completed successfully`,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/v1/inventory:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
