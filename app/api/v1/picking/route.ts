import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// GET /api/v1/picking - Liste les missions de picking
// POST /api/v1/picking - Crée une mission de picking
// PUT /api/v1/picking - Met à jour une mission

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status');

    let query = db.collection('picking');

    if (companyId) {
      query = query.where('companyId', '==', companyId) as any;
    }
    if (warehouseId) {
      query = query.where('warehouseId', '==', warehouseId) as any;
    }
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();
    const pickings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      pickings,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching picking missions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      warehouseId,
      salesOrderId,
      lines, // [{ sku, productName, quantity, binLocation }]
      assignedTo,
      priority = 'normal'
    } = body;

    // Validation
    if (!companyId || !warehouseId || !salesOrderId || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, warehouseId, salesOrderId, lines' },
        { status: 400 }
      );
    }

    // Calculer la route optimisée (simulation simple pour l'instant)
    const route = lines.map((line: any, index: number) => ({
      id: index + 1,
      sku: line.sku,
      productName: line.productName,
      location: line.binLocation || 'A-1-1',
      quantity: line.quantity,
      status: 'pending',
      zone: line.zone || 'FAST',
      x: 100 + (index * 100),
      y: 100 + (index * 50)
    }));

    const pickingData = {
      companyId,
      warehouseId,
      salesOrderId,
      status: 'pending', // pending, in_progress, completed, cancelled
      priority,
      assignedTo: assignedTo || null,
      route,
      totalItems: lines.reduce((sum: number, l: any) => sum + l.quantity, 0),
      itemsPicked: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    const docRef = await db.collection('picking').add(pickingData);

    return NextResponse.json({
      success: true,
      pickingId: docRef.id,
      ...pickingData
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating picking:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pickingId,
      status,
      itemsPicked,
      completedWaypoints = [],
      warehouseId,
      companyId
    } = body;

    if (!pickingId) {
      return NextResponse.json(
        { error: 'pickingId is required' },
        { status: 400 }
      );
    }

    const pickingRef = db.collection('picking').doc(pickingId);
    const pickingDoc = await pickingRef.get();

    if (!pickingDoc.exists) {
      return NextResponse.json(
        { error: 'Picking mission not found' },
        { status: 404 }
      );
    }

    const pickingData = pickingDoc.data();
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      if (status === 'in_progress' && !pickingData?.startedAt) {
        updateData.startedAt = new Date().toISOString();
      }
      
      if (status === 'completed') {
        updateData.completedAt = new Date().toISOString();

        // Créer les mouvements de stock pour chaque ligne pickée
        if (pickingData?.route && warehouseId && companyId) {
          for (const waypoint of pickingData.route) {
            const movementPayload = {
              companyId,
              warehouseId,
              sku: waypoint.sku,
              productName: waypoint.productName,
              movementType: 'picking',
              quantity: -waypoint.quantity, // Négatif car on retire du stock
              binLocation: waypoint.location,
              referenceType: 'sales_order',
              referenceId: pickingData.salesOrderId,
              notes: `Picking pour commande ${pickingData.salesOrderId}`,
              createdAt: new Date().toISOString()
            };

            // Appeler l'API stock/movements
            try {
              const movementResponse = await fetch(`${request.nextUrl.origin}/api/v1/stock/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movementPayload)
              });

              if (!movementResponse.ok) {
                console.error(`Failed to create stock movement for SKU ${waypoint.sku}`);
              }
            } catch (err) {
              console.error('Error calling stock movements API:', err);
            }
          }
        }

        // Mettre à jour le statut de la Sales Order
        if (pickingData?.salesOrderId) {
          try {
            await db.collection('sales_orders').doc(pickingData.salesOrderId).update({
              status: 'picked',
              pickedAt: new Date().toISOString()
            });
          } catch (err) {
            console.error('Error updating sales order status:', err);
          }
        }
      }
    }

    if (itemsPicked !== undefined) {
      updateData.itemsPicked = itemsPicked;
    }

    if (completedWaypoints && completedWaypoints.length > 0) {
      const route = pickingData?.route || [];
      const updatedRoute = route.map((waypoint: any) => {
        if (completedWaypoints.includes(waypoint.id)) {
          return { ...waypoint, status: 'completed' };
        }
        return waypoint;
      });
      updateData.route = updatedRoute;
    }

    await pickingRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Picking mission updated successfully',
      pickingId
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating picking:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
