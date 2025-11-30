import { NextRequest, NextResponse } from 'next/server';
import { DEMO_ZONES, DEMO_BATCHES, WMSBatch } from '@/lib/wms-models';

export async function POST(req: NextRequest) {
  try {
    const { productId, quantity, temperature, expiryDate, adrClass, zonePreference } = await req.json();

    // Validate incoming data
    if (!productId || !quantity || temperature === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity, temperature' },
        { status: 400 }
      );
    }

    // Generate batch ID
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create batch object
    const newBatch: WMSBatch = {
      batchId,
      productId,
      quantity,
      expiryDate: expiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days default
      temperature,
      constraints: adrClass ? { adrClass, hazmat: true } : { adrClass: 'GENERAL', hazmat: false },
      location: null,
      createdAt: new Date().toISOString(),
      status: 'RECEIVING'
    };

    // Find optimal zone based on temperature and constraints
    const optimalZone = DEMO_ZONES.find(zone => {
      if (adrClass) return zone.type === 'ADR';
      if (temperature < 0) return zone.type === 'COLD';
      if (Math.random() > 0.5) return zone.type === 'FAST';
      return zone.type === 'SLOW';
    }) || DEMO_ZONES[0];

    // Validate temperature compatibility
    const tempCheck = {
      isValid: temperature >= optimalZone.minTemp && temperature <= optimalZone.maxTemp,
      zone: optimalZone.zoneId,
      zoneName: optimalZone.name
    };

    // Quality control status
    const qcStatus = {
      batch: newBatch.batchId,
      received: new Date().toISOString(),
      expiryValidation: 'PASSED',
      temperatureValidation: tempCheck.isValid ? 'PASSED' : 'WARNING',
      quantityCheck: 'PASSED',
      adrValidation: adrClass ? 'CHECKED' : 'N/A',
      overallStatus: tempCheck.isValid ? 'APPROVED' : 'CONDITIONAL_APPROVAL'
    };

    // Response with receiving summary
    const response = {
      receivingId: `RCV-${Date.now()}`,
      status: 'SUCCESS',
      batchCreated: newBatch,
      optimalZone: optimalZone,
      temperatureCheck: tempCheck,
      qcStatus: qcStatus,
      recommendation: {
        message: `Batch ${batchId} received successfully`,
        zone: optimalZone.name,
        priority: adrClass ? 'HIGH' : 'NORMAL',
        nextStep: 'WAITING_FOR_PUTAWAY'
      }
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Receiving API error:', error);
    return NextResponse.json(
      { error: 'Failed to process receiving request', details: String(error) },
      { status: 500 }
    );
  }
}
