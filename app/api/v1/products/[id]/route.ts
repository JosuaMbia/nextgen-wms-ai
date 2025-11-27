import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Schema de validation partiel pour la mise à jour
const productUpdateSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  unit: z.enum(['piece', 'box', 'pallet', 'kg', 'liter', 'meter']).optional(),
  price: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  }).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  warehouseId: z.string().min(1).optional(),
  barcode: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Récupérer un produit par ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const productId = params.id;
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productSnap.data();

    // Vérifier que le produit appartient au tenant
    if (productData.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: productSnap.id,
          ...productData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour un produit
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const productId = params.id;
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const existingProduct = productSnap.data();

    // Vérifier que le produit appartient au tenant
    if (existingProduct.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Valider les données avec Zod
    const validationResult = productUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const updateData = {
      ...validationResult.data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(productRef, updateData);

    // Récupérer le produit mis à jour
    const updatedProductSnap = await getDoc(productRef);

    return NextResponse.json(
      {
        success: true,
        message: 'Product updated successfully',
        data: {
          id: updatedProductSnap.id,
          ...updatedProductSnap.data(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer un produit
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const productId = params.id;
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productSnap.data();

    // Vérifier que le produit appartient au tenant
    if (productData.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Vérifier si le produit a du stock
    if (productData.currentStock && productData.currentStock > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete product with existing stock',
          details: 'Please transfer or remove the stock before deleting this product',
        },
        { status: 409 }
      );
    }

    await deleteDoc(productRef);

    return NextResponse.json(
      {
        success: true,
        message: 'Product deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
