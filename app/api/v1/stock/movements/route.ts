import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/v1/stock/movements
 * Crée un mouvement de stock (IN, OUT, ADJUSTMENT, TRANSFER)
 * et met à jour le stock courant dans la collection 'stock'
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      companyId,
      warehouseId,
      sku,
      productName,
      movementType, // 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER'
      quantity,
      uom,
      binLocation,
      reference, // ID du document source (receipt, order, etc.)
      referenceType, // 'RECEIPT' | 'ORDER' | 'ADJUSTMENT' | 'TRANSFER'
      lotNumber,
      serialNumber,
      createdBy,
      notes,
    } = body;

    // Validation
    if (!companyId || !warehouseId || !sku || !movementType || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'].includes(movementType)) {
      return NextResponse.json(
        { error: 'Invalid movementType' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // 1. Créer le mouvement de stock
    const movementData = {
      companyId,
      warehouseId,
      sku,
      productName: productName || sku,
      movementType,
      quantity: Number(quantity),
      uom: uom || 'PCS',
      binLocation: binLocation || 'DEFAULT',
      reference: reference || null,
      referenceType: referenceType || null,
      lotNumber: lotNumber || null,
      serialNumber: serialNumber || null,
      createdBy: createdBy || 'system',
      createdAt: timestamp,
      notes: notes || null,
    };

    const movementRef = await db.collection('stock_movements').add(movementData);

    // 2. Mettre à jour le stock courant
    // Clé composite: companyId_warehouseId_sku_binLocation
    const stockKey = `${companyId}_${warehouseId}_${sku}_${binLocation || 'DEFAULT'}`;
    const stockRef = db.collection('stock').doc(stockKey);
    const stockDoc = await stockRef.get();

    if (!stockDoc.exists) {
      // Créer le document stock si n'existe pas
      const initialQty = movementType === 'IN' ? quantity : -quantity;
      await stockRef.set({
        companyId,
        warehouseId,
        sku,
        productName: productName || sku,
        binLocation: binLocation || 'DEFAULT',
        quantityOnHand: initialQty,
        uom: uom || 'PCS',
        lastMovementAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } else {
      // Mettre à jour le stock existant
      const currentQty = stockDoc.data()?.quantityOnHand || 0;
      const delta = movementType === 'IN' ? quantity : -quantity;
      const newQty = currentQty + delta;

      await stockRef.update({
        quantityOnHand: newQty,
        lastMovementAt: timestamp,
        updatedAt: timestamp,
      });
    }

    return NextResponse.json(
      {
        success: true,
        movementId: movementRef.id,
        message: 'Stock movement created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/v1/stock/movements:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/stock/movements
 * Liste les mouvements de stock avec filtres optionnels
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const warehouseId = searchParams.get('warehouseId');
    const sku = searchParams.get('sku');
    const movementType = searchParams.get('movementType');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    let query = db
      .collection('stock_movements')
      .where('companyId', '==', companyId);

    if (warehouseId) {
      query = query.where('warehouseId', '==', warehouseId);
    }

    if (sku) {
      query = query.where('sku', '==', sku);
    }

    if (movementType) {
      query = query.where('movementType', '==', movementType);
    }

    query = query.orderBy('createdAt', 'desc').limit(limit);

    const snapshot = await query.get();
    const movements = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ movements }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/v1/stock/movements:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
