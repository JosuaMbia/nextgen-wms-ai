import { NextRequest, NextResponse } from 'next/server';
import { DEMO_BATCHES, WMSPickingOrder } from '@/lib/wms-models';

export async function POST(req: NextRequest) {
  try {
    const { orderId, warehouseLayout, palletConfig } = await req.json();

    // Find picking order
    const order = DEMO_BATCHES.pickingOrders.find(
      (o) => o.id === orderId
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Picking order not found' },
        { status: 404 }
      );
    }

    // Build visual route (optimized waypoint sequence)
    const route = buildOptimalRoute(order, warehouseLayout);

    // Calculate optimal palletization
    const palletization = optimizePalletization(
      order.items,
      palletConfig
    );

    return NextResponse.json({
      orderId,
      route: {
        waypoints: route.waypoints,
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
      },
      palletization: {
        pallets: palletization.pallets,
        utilization: palletization.utilization,
        efficiency: palletization.efficiency,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Picking optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize picking route' },
      { status: 500 }
    );
  }
}

function buildOptimalRoute(
  order: WMSPickingOrder,
  warehouseLayout: any
) {
  // TSP-like algorithm for warehouse picking
  const waypoints = order.items.map((item) => ({
    sku: item.sku,
    zone: item.zone,
    coordinates: getZoneCoordinates(item.zone, warehouseLayout),
    quantity: item.quantity,
  }));

  // Sort by zone proximity (simplified TSP)
  waypoints.sort((a, b) => {
    const zoneOrder: Record<string, number> = {
      FAST: 1,
      SLOW: 2,
      COLD: 3,
      ADR: 4,
    };
    return (zoneOrder[a.zone] || 0) - (zoneOrder[b.zone] || 0);
  });

  // Calculate distance
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx =
      waypoints[i + 1].coordinates.x - waypoints[i].coordinates.x;
    const dy =
      waypoints[i + 1].coordinates.y - waypoints[i].coordinates.y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }

  return {
    waypoints,
    totalDistance: Math.round(totalDistance * 100) / 100,
    estimatedTime: Math.ceil(totalDistance / 2), // Assume 2 meters/minute walking speed
  };
}

function optimizePalletization(
  items: any[],
  palletConfig: any
) {
  const pallets: any[] = [];
  let currentPallet: any = null;

  for (const item of items) {
    if (
      !currentPallet ||
      currentPallet.weight + item.weight > palletConfig.maxWeight ||
      currentPallet.items.length >= palletConfig.maxItems
    ) {
      if (currentPallet) {
        pallets.push(currentPallet);
      }
      currentPallet = {
        id: `PLT-${pallets.length + 1}`,
        items: [],
        weight: 0,
        volume: 0,
      };
    }

    currentPallet.items.push(item);
    currentPallet.weight += item.weight;
    currentPallet.volume += item.volume || item.quantity * 0.05; // Estimate volume
  }

  if (currentPallet) {
    pallets.push(currentPallet);
  }

  // Calculate utilization metrics
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const totalVolume = items.reduce(
    (sum, item) => sum + (item.volume || item.quantity * 0.05),
    0
  );
  const theoreticalMaxWeight = pallets.length * palletConfig.maxWeight;
  const theoreticalMaxVolume = pallets.length * palletConfig.maxVolume;

  return {
    pallets,
    utilization: {
      weight: Math.round((totalWeight / theoreticalMaxWeight) * 100),
      volume: Math.round((totalVolume / theoreticalMaxVolume) * 100),
    },
    efficiency: Math.round(
      ((totalWeight / theoreticalMaxWeight +
        totalVolume / theoreticalMaxVolume) /
        2) *
        100
    ),
  };
}

function getZoneCoordinates(
  zone: string,
  warehouseLayout: any
): { x: number; y: number } {
  // Default warehouse zone coordinates
  const zones: Record<string, { x: number; y: number }> = {
    FAST: { x: 10, y: 10 },
    SLOW: { x: 30, y: 10 },
    COLD: { x: 10, y: 30 },
    ADR: { x: 30, y: 30 },
  };
  return zones[zone] || { x: 0, y: 0 };
}
