import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schema for warehouse creation
const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  location: z.string().min(1, 'Location is required'),
  capacity: z.number().positive('Capacity must be positive'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
});

// GET /api/v1/warehouses - List all warehouses for a tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const warehousesRef = collection(db, 'warehouses');
    const q = query(warehousesRef, where('tenantId', '==', tenantId));
    const querySnapshot = await getDocs(q);
    
    const warehouses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: warehouses,
      count: warehouses.length
    });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/v1/warehouses - Create a new warehouse
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
    const validationResult = warehouseSchema.safeParse({ ...body, tenantId });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const warehouseData = {
      ...validationResult.data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'warehouses'), warehouseData);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...warehouseData },
      message: 'Warehouse created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse', details: error.message },
      { status: 500 }
    );
  }
}
