import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schema for warehouse update
const warehouseUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().min(1).optional(),
  capacity: z.number().positive().optional(),
});

// GET /api/v1/warehouses/[id] - Get a specific warehouse
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const warehouseRef = doc(db, 'warehouses', params.id);
    const warehouseSnap = await getDoc(warehouseRef);

    if (!warehouseSnap.exists()) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    const warehouseData = warehouseSnap.data();

    // Verify tenant ownership
    if (warehouseData.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: warehouseSnap.id, ...warehouseData }
    });
  } catch (error: any) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/v1/warehouses/[id] - Update a warehouse
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const warehouseRef = doc(db, 'warehouses', params.id);
    const warehouseSnap = await getDoc(warehouseRef);

    if (!warehouseSnap.exists()) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    const warehouseData = warehouseSnap.data();

    // Verify tenant ownership
    if (warehouseData.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = warehouseUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updateData = {
      ...validationResult.data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(warehouseRef, updateData);

    return NextResponse.json({
      success: true,
      data: { id: params.id, ...warehouseData, ...updateData },
      message: 'Warehouse updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to update warehouse', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/warehouses/[id] - Delete a warehouse
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const warehouseRef = doc(db, 'warehouses', params.id);
    const warehouseSnap = await getDoc(warehouseRef);

    if (!warehouseSnap.exists()) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    const warehouseData = warehouseSnap.data();

    // Verify tenant ownership
    if (warehouseData.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    await deleteDoc(warehouseRef);

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to delete warehouse', details: error.message },
      { status: 500 }
    );
  }
}
