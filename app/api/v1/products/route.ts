import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// Schema de validation pour un produit
const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  name: z.string().min(1, 'Product name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  unit: z.enum(['piece', 'box', 'pallet', 'kg', 'liter', 'meter']),
  price: z.number().min(0, 'Price must be positive'),
  weight: z.number().min(0, 'Weight must be positive').optional(),
  dimensions: z.object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  }).optional(),
  minStock: z.number().int().min(0, 'Minimum stock must be positive').default(0),
  maxStock: z.number().int().min(0, 'Maximum stock must be positive').optional(),
  reorderPoint: z.number().int().min(0, 'Reorder point must be positive').default(10),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  barcode: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

// GET: Récupérer tous les produits pour un tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    // Construire la requête Firestore
    const productsRef = collection(db, 'products');
    let q = query(productsRef, where('tenantId', '==', tenantId));

    // Ajouter des filtres optionnels
    if (warehouseId) {
      q = query(q, where('warehouseId', '==', warehouseId));
    }
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (active !== null) {
      q = query(q, where('active', '==', active === 'true'));
    }

    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(
      {
        success: true,
        count: products.length,
        data: products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Créer un nouveau produit
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
    
    // Valider les données avec Zod
    const validationResult = productSchema.safeParse(body);
    
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

    const productData = validationResult.data;

    // Vérifier si le SKU existe déjà pour ce tenant
    const productsRef = collection(db, 'products');
    const skuQuery = query(
      productsRef,
      where('tenantId', '==', tenantId),
      where('sku', '==', productData.sku)
    );
    const existingProduct = await getDocs(skuQuery);

    if (!existingProduct.empty) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 409 }
      );
    }

    // Créer le produit avec les métadonnées
    const newProduct = {
      ...productData,
      tenantId,
      currentStock: 0,
      reservedStock: 0,
      availableStock: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(productsRef, newProduct);

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: {
          id: docRef.id,
          ...newProduct,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
