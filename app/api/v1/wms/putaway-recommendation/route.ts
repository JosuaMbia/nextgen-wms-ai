import { NextRequest, NextResponse } from 'next/server';
import { DEMO_ZONES, DEMO_BATCHES, WMSBatch } from '@/lib/wms-models';

export async function POST(req: NextRequest) {
  try {
    const { batchId, quantity, temperature, expiryDate, adrClass } = await req.json();

    if (!batchId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find batch details from demo data
    const batch = DEMO_BATCHES.find(b => b.batchId === batchId);

    // Calculate zone recommendations based on criteria
    const recommendations = DEMO_ZONES.map(zone => {
      let score = 100;
      let reasons = [];

      // ADR constraint check
      if (adrClass === 'ADR' && zone.type !== 'ADR') {
        score -= 50;
        reasons.push('ADR zone required');
      }

      // Temperature compatibility
      if (temperature >= zone.minTemp && temperature <= zone.maxTemp) {
        score += 20;
        reasons.push('Temperature compatible');
      } else {
        score -= 30;
        reasons.push('Temperature mismatch');
      }

      // FIFO/FEFO compliance (prefer less full zones for faster rotation)
      const zoneUtilization = Math.random() * 100;
      if (zoneUtilization < 60) {
        score += 15;
        reasons.push('Good for FIFO rotation');
      }

      // Slow-moving vs Fast-moving products
      if ((batch && batch.category === 'FAST' && zone.type === 'FAST') ||
          (batch && batch.category === 'SLOW' && zone.type === 'SLOW')) {
        score += 25;
        reasons.push('Zone type matches product category');
      }

      return {
        zoneId: zone.zoneId,
        zoneName: zone.name,
        zoneType: zone.type,
        score,
        reasons,
        utilization: zoneUtilization,
        capacity: zone.capacity
      };
    });

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    // Get top recommendation
    const optimalZone = recommendations[0];

    const response = {
      putawayId: `PUT-${Date.now()}`,
      batchId,
      status: 'RECOMMENDED',
      recommendations: recommendations.slice(0, 3), // Top 3 options
      optimalZone: {
        zoneId: optimalZone.zoneId,
        zoneName: optimalZone.zoneName,
        confidence: optimalZone.score,
        reasons: optimalZone.reasons
      },
      fifoCompliance: {
        status: 'COMPLIANT',
        method: 'Oldest-first placement in zone',
        rotationPriority: 'HIGH'
      },
      crossdockingRecommendation: optimalZone.utilization > 80 ? 'DIRECT_TO_SHIPPING' : 'STANDARD_STORAGE',
      estimatedPlacementTime: '2-5 minutes'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Putaway API error:', error);
    return NextResponse.json(
      { error: 'Failed to process putaway request', details: String(error) },
      { status: 500 }
    );
  }
}
