import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

// Interface pour les lignes de PO
interface PurchaseOrderLine {
  sku: string;
  productName: string;
  expectedQty: number;
  receivedQty?: number;
  user: string;
  warehouseId: number;
}

// Interface pour le PO
interface PurchaseOrder {
  id: string;
  supplier: string;
  productNames: string[];
  orderedQty: number;
  receivedQty: number;
  user: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'closed';
  createdAt: Date;
  lines: PurchaseOrderLine[];
  currency: string;
}

/**
 * POST /api/v1/purchase-orders
 * Créer un nouveau Purchase Order dans Firestore
 */
export async function POST(request: NextRequest) {
  try {
    // Initialiser Firebase Admin
    initAdmin();
    const db = getFirestore();

    // Parser le body de la requête
    const body = await request.json();
    
    // Validation des champs requis
    if (!body.poNumber || !body.supplier || !body.lines || !Array.isArray(body.lines)) {
      return NextResponse.json(
        { error: 'Missing required fields: poNumber, supplier, lines' },
        { status: 400 }
      );
    }

    // Validation des lignes
    if (body.lines.length === 0) {
      return NextResponse.json(
        { error: 'At least one line is required' },
        { status: 400 }
      );
    }

    // Valider chaque ligne
    for (const line of body.lines) {
      if (!line.sku || !line.productName || !line.expectedQty || !line.user) {
        return NextResponse.json(
          { error: 'Each line must have sku, productName, expectedQty, and user' },
          { status: 400 }
        );
      }
    }

    // Calculer les quantités totales
    const orderedQty = body.lines.reduce((sum: number, line: PurchaseOrderLine) => sum + line.expectedQty, 0);

    // Extraire les noms de produits
    const productNames = body.lines.map((line: PurchaseOrderLine) => line.productName);

    // Créer l'objet PO
    const purchaseOrder: Omit<PurchaseOrder, 'id'> = {
      supplier: body.supplier,
      productNames,
      orderedQty,
      receivedQty: 0,
      user: body.lines[0].user, // Utiliser le user de la première ligne
      status: 'draft',
      createdAt: new Date(),
      lines: body.lines,
      currency: body.currency || 'USD',
    };

    // Enregistrer dans Firestore avec le poNumber comme ID
    const poRef = db.collection('purchase_orders').doc(body.poNumber);
    
    // Vérifier si le PO existe déjà
    const existingPo = await poRef.get();
    if (existingPo.exists) {
      return NextResponse.json(
        { error: `Purchase Order ${body.poNumber} already exists` },
        { status: 409 }
      );
    }

    // Créer le PO
    await poRef.set(purchaseOrder);

    return NextResponse.json(
      {
        success: true,
        poNumber: body.poNumber,
        message: 'Purchase Order created successfully',
        data: {
          id: body.poNumber,
          ...purchaseOrder,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/purchase-orders
 * Récupérer tous les Purchase Orders
 */
export async function GET(request: NextRequest) {
  try {
    initAdmin();
    const db = getFirestore();

    // Optionnel: filtrer par status via query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = db.collection('purchase_orders');
    
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    
    const purchaseOrders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders,
    });

  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
