import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const doc = await adminDb.collection('receipts').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, message: 'Receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error: any) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
