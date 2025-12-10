import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/lib/firebase-admin';

/**
 * GET /api/v1/receipts
 * Récupère la liste des réceptions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const warehouseId = searchParams.get('warehouseId');
    const poId = searchParams.get('poId');

    let query = adminDB.collection('receipts');

    if (companyId) {
      query = query.where('companyId', '==', companyId) as any;
    }
    if (warehouseId) {
      query = query.where('warehouseId', '==', warehouseId) as any;
    }
    if (poId) {
      query = query.where('poId', '==', poId) as any;
    }

    const snapshot = await query.orderBy('receiptDate', 'desc').limit(100).get();
    
    const receipts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      receipts,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/receipts
 * Crée une nouvelle réception, met à jour le stock via stock/movements,
 * et met à jour le statut du PO
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, warehouseId, poId, reference, receiptDate, createdBy, lines, status } = body;

    // Validation
    if (!companyId || !warehouseId || !poId || !reference || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, warehouseId, poId, reference, lines' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // 1. Créer le document receipt dans Firestore
    const receiptData = {
      companyId,
      warehouseId,
      poId,
      reference,
      receiptDate: receiptDate || timestamp,
      status: status || 'completed',
      createdBy: createdBy || 'system',
      createdAt: timestamp,
      updatedAt: timestamp,
      lines: lines.map((l: any) => ({
        lineId: l.lineId,
        poLineId: l.poLineId || null,
        sku: l.sku,
        productName: l.productName,
        expectedQty: l.expectedQty || null,
        receivedQty: l.receivedQty,
        uom: l.uom || 'PCS',
        binLocation: l.binLocation || 'RECEPTION',
        lotNumber: l.lotNumber || null,
        serialNumber: l.serialNumber || null,
      })),
    };

    const receiptRef = await db.collection('receipts').add(receiptData);
    const receiptId = receiptRef.id;

    console.log(`✅ Receipt created with ID: ${receiptId}`);

    // 2. Pour chaque ligne, créer un mouvement de stock via l'API stock/movements
    const stockMovementPromises = lines.map(async (line: any) => {
      const stockMovementBody = {
        companyId,
        warehouseId,
        sku: line.sku,
        productName: line.productName,
        movementType: 'IN',
        quantity: line.receivedQty,
        uom: line.uom || 'PCS',
        binLocation: line.binLocation || 'RECEPTION',
        reference: receiptId,
        referenceType: 'RECEIPT',
        lotNumber: line.lotNumber || null,
        serialNumber: line.serialNumber || null,
        createdBy: createdBy || 'system',
        notes: `Réception depuis PO ${poId}`,
      };

      // Appel interne à l'API stock/movements
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const stockRes = await fetch(`${baseUrl}/api/v1/stock/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockMovementBody),
      });

      if (!stockRes.ok) {
        const errorText = await stockRes.text();
        console.error(`Error creating stock movement for SKU ${line.sku}:`, errorText);
        throw new Error(`Failed to create stock movement for SKU ${line.sku}`);
      }

      const stockData = await stockRes.json();
      console.log(`✅ Stock movement created for SKU ${line.sku}:`, stockData.movementId);
      return stockData;
    });

    await Promise.all(stockMovementPromises);

    // 3. Mettre à jour le statut du PO
    const poRef = db.collection('purchase_orders').doc(poId);
    const poDoc = await poRef.get();

    if (poDoc.exists) {
      const poData = poDoc.data();
      const poLines = poData?.lines || [];

      // Calculer si le PO est partiellement reçu ou complètement reçu
      let totalOrdered = 0;
      let totalReceived = 0;

      for (const poLine of poLines) {
        totalOrdered += poLine.orderedQty || 0;
        const receivedForThisLine = lines.find((l: any) => l.poLineId === poLine.lineId);
        if (receivedForThisLine) {
          totalReceived += receivedForThisLine.receivedQty || 0;
        }
      }

      let newStatus = 'partially_received';
      if (totalReceived >= totalOrdered) {
        newStatus = 'closed';
      }

      await poRef.update({
        status: newStatus,
        updatedAt: timestamp,
      });

      console.log(`✅ PO ${poId} status updated to: ${newStatus}`);
    } else {
      console.warn(`⚠️ PO ${poId} not found, skipping status update`);
    }

    return NextResponse.json(
      {
        success: true,
        receiptId,
        message: 'Receipt created, stock updated, and PO status updated successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
