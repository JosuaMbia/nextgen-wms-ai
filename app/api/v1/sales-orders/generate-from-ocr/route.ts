import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { SalesOrder, SalesOrderLine, SOStatus } from '@/lib/sales-order-models';

/**
 * POST /api/v1/sales-orders/generate-from-ocr
 * 
 * Generate a Sales Order from OCR-extracted quote/devis data
 * 
 * Request body:
 * {
 *   ocrId: string;           // Link to source OCR receipt
 *   quoteNumber: string;     // From OCR: devis number
 *   clientId: string;
 *   clientName: string;
 *   clientEmail?: string;
 *   lines: Array<{
 *     sku: string;
 *     productName: string;
 *     quantity: number;
 *     unitPrice: number;
 *     ocrConfidence?: number;
 *   }>;
 *   warehouseId: string;
 *   notes?: string;
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      ocrId,
      quoteNumber,
      clientId,
      clientName,
      clientEmail,
      lines,
      warehouseId,
      notes
    } = body;

    // Validation
    if (!clientId || !clientName || !lines || lines.length === 0 || !warehouseId) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, clientName, lines, warehouseId' },
        { status: 400 }
      );
    }

    // Generate SO number (e.g., SO-2025-0001)
    const year = new Date().getFullYear();
    const soCounterRef = db.collection('counters').doc('sales-orders');
    const soCounterDoc = await soCounterRef.get();
    
    let nextNumber = 1;
    if (soCounterDoc.exists) {
      nextNumber = (soCounterDoc.data()?.count || 0) + 1;
    }
    
    const soNumber = `SO-${year}-${String(nextNumber).padStart(4, '0')}`;
    
    // Calculate totals
    const salesOrderLines: SalesOrderLine[] = lines.map((line: any, idx: number) => ({
      lineId: `line-${idx + 1}`,
      sku: line.sku,
      productName: line.productName,
      quantityOrdered: line.quantity,
      quantityAvailable: 0,  // Will be filled by stock check
      quantityToPick: 0,
      quantityToPurchase: 0,
      unitPrice: line.unitPrice,
      totalPrice: line.quantity * line.unitPrice,
      uom: line.uom || 'PCS',
      ocrConfidence: line.ocrConfidence
    }));

    const totalAmount = salesOrderLines.reduce((sum, line) => sum + line.totalPrice, 0);

    // Create Sales Order
    const soId = db.collection('sales-orders').doc().id;
    const now = Date.now();

    const salesOrder: SalesOrder = {
      soId,
      soNumber,
      sourceType: 'OCR',
      sourceOcrId: ocrId,
      quoteNumber,
      clientId,
      clientName,
      clientEmail,
      lines: salesOrderLines,
      totalAmount,
      currency: 'EUR',
      status: 'PENDING_VALIDATION' as SOStatus,
      warehouseId,
      createdAt: now,
      updatedAt: now,
      notes
    };

    // Save to Firestore
    await db.collection('sales-orders').doc(soId).set(salesOrder);
    
    // Increment counter
    await soCounterRef.set(
      { count: nextNumber, lastUpdated: now },
      { merge: true }
    );

    console.log(`✅ Sales Order created: ${soNumber} (${soId})`);

    return NextResponse.json({
      success: true,
      salesOrder,
      message: `Sales Order ${soNumber} created successfully. Awaiting client validation.`
    });

  } catch (error: any) {
    console.error('❌ Error generating Sales Order from OCR:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate Sales Order',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
