import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory
} from '@/lib/services/ProductService';

// Product schema
const ProductCreateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().min(1),
  unit: z.enum(['piece', 'box', 'pallet', 'kg', 'liter', 'meter']),
  price: z.number().min(0),
  weight: z.number().min(0).optional(),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).default(10),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active')
});

const ProductUpdateSchema = ProductCreateSchema.partial();

// GET /api/v1/products - List products with filters
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
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let data;

    if (search) {
      data = await searchProducts(tenantId, search);
    } else if (category) {
      data = await getProductsByCategory(tenantId, category as any);
    } else {
      data = await getProducts(tenantId, status as any);
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error in GET /api/v1/products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/products - Create product
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
    const validatedData = ProductCreateSchema.parse(body);

    const productId = await createProduct(tenantId, validatedData as any, 'api-user');

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: { id: productId }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/v1/products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/products/:id - Update product
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
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = ProductUpdateSchema.parse(body);

    await updateProduct(tenantId, productId, validatedData as any, 'api-user');

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/v1/products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/products/:id - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await deleteProduct(tenantId, productId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/v1/products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
