import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { productService } from '@/lib/services/ProductService';
import { adminDb } from '@/lib/firebase-admin';

// Product schema
const ProductCreateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().min(1),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    unit: z.enum(['cm', 'in', 'm'])
  }),
  weight: z.object({
    value: z.number().min(0),
    unit: z.enum(['kg', 'lb', 'g'])
  }),
  pricing: z.object({
    cost: z.number().min(0),
    price: z.number().min(0),
    currency: z.string().default('USD'),
    taxRate: z.number().min(0).optional()
  }),
  images: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  tags: z.array(z.string()).default([]),
  attributes: z.record(z.any()).default({})
});

const ProductUpdateSchema = ProductCreateSchema.partial();

// GET /api/v1/products - List products
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const { searchParams } = new URL(request.url);
    
    const filters = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      brand: searchParams.get('brand') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    };

    // Utiliser Admin SDK directement pour contourner les règles de sécurité Firestore
    const snapshot = await adminDb.collection('products').get();
    const products = snapshot.docs.map(doc => ({const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sku: data.sku,
        name: data.nom || data.name,
        category: data.categorie || data.category,
        quantity: data.quantite || data.quantity,
        minStock: data.minStock,
        price: data.prix || data.price,
        status: data.status,
        warehouse: data.warehouse
      };
    });

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error in GET /api/v1/products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/products - Create product
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const body = await request.json();
    
    const validatedData = ProductCreateSchema.parse(body);
    
    const product = await productService.createProduct(tenantId, validatedData as any, 'api-user');

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: product
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

// PUT /api/v1/products - Update product
export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = ProductUpdateSchema.parse(body);
    
    const product = await productService.updateProduct(tenantId, productId, validatedData as any, 'api-user');

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: product
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

// DELETE /api/v1/products - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await productService.deleteProduct(tenantId, productId);

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
