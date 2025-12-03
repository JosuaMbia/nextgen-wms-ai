import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Simplified Product schema matching actual data structure
const ProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().min(0),
  price: z.number().min(0),
  // Stock Management - NEW
  minStock: z.number().min(0).optional(),
  avgStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  // Optional fields
  warehouse: z.string().optional(),
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
  description: z.string().optional(),
  // AI Suggestions - NEW
  aiSuggestedMin: z.number().optional(),
  aiSuggestedAvg: z.number().optional(),
  aiSuggestedMax: z.number().optional(),
  lastAiAnalysis: z.any().optional(),
  aiConfidenceScore: z.number().min(0).max(100).optional(),
});

const ProductUpdateSchema = ProductSchema.partial();

// GET /api/v1/products - List products
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const { searchParams } = new URL(request.url);
    
    const filters = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    };

    // Use Admin SDK to bypass Firestore rules
    const snapshot = await adminDb.collection('products').get();
    
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sku: data.sku,
        name: data.nom || data.name,
        category: data.categorie || data.category,
        quantity: data.quantite || data.quantity || 0,
        price: data.prix || data.price || 0,
        // Stock Management
        minStock: data.minStock,
        avgStock: data.avgStock,
        maxStock: data.maxStock,
        // Optional
        warehouse: data.warehouse,
        status: data.status,
        description: data.description,
        // AI fields
        aiSuggestedMin: data.aiSuggestedMin,
        aiSuggestedAvg: data.aiSuggestedAvg,
        aiSuggestedMax: data.aiSuggestedMax,
        lastAiAnalysis: data.lastAiAnalysis,
        aiConfidenceScore: data.aiConfidenceScore,
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
    
    const validatedData = ProductSchema.parse(body);
    
    // Create product in Firestore
    const productRef = await adminDb.collection('products').add({
      ...validatedData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      tenantId
    });

    const productDoc = await productRef.get();
    const product = { id: productDoc.id, ...productDoc.data() };

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

// PUT /api/v1/products/:id - Update product
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
    
    // Update product in Firestore
    const productRef = adminDb.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await productRef.update({
      ...validatedData,
      updatedAt: FieldValue.serverTimestamp()
    });

    const updatedDoc = await productRef.get();
    const product = { id: updatedDoc.id, ...updatedDoc.data() };

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

// DELETE /api/v1/products/:id - Delete product
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

    const productRef = adminDb.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await productRef.delete();

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
