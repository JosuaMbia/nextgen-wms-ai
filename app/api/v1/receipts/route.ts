import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/v1/receipts
 * Récupère la liste des réceptions
 */
export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('receipts').orderBy('date', 'desc').get();
    
    const receipts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: receipts,
    });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/receipts
 * Crée une nouvelle réception et met à jour les stocks + lots
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, supplier, date, lines } = body;

    // Validation basique
    if (!reference || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: reference, lines' },
        { status: 400 }
      );
    }

    // Convertir la date string en Timestamp Firestore
    const receiptDate = date ? Timestamp.fromDate(new Date(date)) : Timestamp.now();

    // Préparer le document de réception
    const receiptData = {
      reference,
      supplier: supplier || '',
      date: receiptDate,
      status: 'received',
      lines: lines.map((line: any) => ({
        productId: line.productId,
        sku: line.sku,
        name: line.name,
        orderedQty: line.orderedQty || null,
        receivedQty: line.receivedQty,
        lotNumber: line.lotNumber,
        expiryDate: line.expiryDate ? Timestamp.fromDate(new Date(line.expiryDate)) : null,
        temperatureZone: line.temperatureZone || 'ambient',
      })),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Transaction Firestore pour garantir la cohérence
    const result = await adminDb.runTransaction(async (transaction) => {
      // 1. Créer le document de réception
      const receiptRef = adminDb.collection('receipts').doc();
      transaction.set(receiptRef, receiptData);

      // 2. Pour chaque ligne, mettre à jour le stock produit et créer/mettre à jour le lot
      for (const line of lines) {
        const { productId, receivedQty, lotNumber, sku, name, expiryDate, temperatureZone } = line;

        // Mettre à jour la quantité du produit
        const productRef = adminDb.collection('products').doc(productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Product with ID ${productId} not found`);
        }

        const currentQty = productDoc.data()?.quantity || 0;
        transaction.update(productRef, {
          quantity: currentQty + receivedQty,
          updatedAt: Timestamp.now(),
        });

        // Créer ou mettre à jour le lot dans stockLots
        const existingLotsSnapshot = await adminDb
          .collection('stockLots')
          .where('productId', '==', productId)
          .where('lotNumber', '==', lotNumber)
          .get();

        if (!existingLotsSnapshot.empty) {
          // Lot existant : incrémenter la quantité
          const existingLotDoc = existingLotsSnapshot.docs[0];
          const existingQty = existingLotDoc.data().quantity || 0;
          transaction.update(existingLotDoc.ref, {
            quantity: existingQty + receivedQty,
            updatedAt: Timestamp.now(),
          });
        } else {
          // Nouveau lot : créer
          const newLotRef = adminDb.collection('stockLots').doc();
          transaction.set(newLotRef, {
            productId,
            sku,
            name,
            lotNumber,
            expiryDate: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
            temperatureZone: temperatureZone || 'ambient',
            quantity: receivedQty,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }

      return receiptRef.id;
    });

    return NextResponse.json({
      success: true,
      message: 'Receipt created successfully',
      data: { id: result },
    });
  } catch (error: any) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create receipt' },
      { status: 500 }
    );
  }
}
