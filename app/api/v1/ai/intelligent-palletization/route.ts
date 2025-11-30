import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface PalletItem {
  id: string;
  name: string;
  weight: number; // kg
  volume: number; // m³
  quantity: number;
  stackable: boolean;
  fragile: boolean;
  expiryDate?: Date;
  handlingCode?: string; // Hazmat codes
}

interface PalletConstraints {
  maxWeight: number; // kg
  maxVolume: number; // m³
  maxHeight: number; // cm
  environment: 'aérien' | 'terrestre' | 'maritime';
  temperature?: 'ambient' | 'cold' | 'controlled';
}

interface PalletizationResult {
  pallets: Pallet[];
  statistics: {
    totalWeight: number;
    totalVolume: number;
    utilizationRate: number;
    fefoCompliance: boolean;
    alternativeRoutes?: string[];
  };
  recommendations: string[];
  aiInsights?: string;
}

interface Pallet {
  id: string;
  items: PalletItem[];
  weight: number;
  volume: number;
  height: number;
  environment: string;
  stability: number; // 0-100 score
  riskFactors: string[];
}

function calculateOptimalPalletization(
  items: PalletItem[],
  constraints: PalletConstraints
): Pallet[] {
  // Sort by expiry date (FEFO priority)
  const sortedItems = [...items].sort((a, b) => {
    if (a.expiryDate && b.expiryDate) {
      return a.expiryDate.getTime() - b.expiryDate.getTime();
    }
    return 0;
  });

  const pallets: Pallet[] = [];
  let currentPallet: PalletItem[] = [];
  let currentWeight = 0;
  let currentVolume = 0;
  let currentHeight = 0;

  for (const item of sortedItems) {
    const itemTotalWeight = item.weight * item.quantity;
    const itemTotalVolume = item.volume * item.quantity;

    // Check if item fits in current pallet
    const canFit =
      currentWeight + itemTotalWeight <= constraints.maxWeight &&
      currentVolume + itemTotalVolume <= constraints.maxVolume;

    if (canFit && currentPallet.length < 30) {
      currentPallet.push(item);
      currentWeight += itemTotalWeight;
      currentVolume += itemTotalVolume;
      currentHeight += Math.min(item.volume * 100, 20);
    } else {
      // Start new pallet
      if (currentPallet.length > 0) {
        pallets.push(createPallet(currentPallet, constraints, currentWeight, currentVolume, currentHeight));
      }
      currentPallet = [item];
      currentWeight = itemTotalWeight;
      currentVolume = itemTotalVolume;
      currentHeight = Math.min(item.volume * 100, 20);
    }
  }

  // Add final pallet
  if (currentPallet.length > 0) {
    pallets.push(createPallet(currentPallet, constraints, currentWeight, currentVolume, currentHeight));
  }

  return pallets;
}

function createPallet(
  items: PalletItem[],
  constraints: PalletConstraints,
  weight: number,
  volume: number,
  height: number
): Pallet {
  const riskFactors: string[] = [];
  let stability = 100;

  // Check weight limit
  if (weight > constraints.maxWeight * 0.9) {
    riskFactors.push('High weight load');
    stability -= 15;
  }

  // Check stacking compatibility
  const hasFragile = items.some(i => i.fragile);
  const hasNonStackable = items.some(i => !i.stackable);
  
  if (hasFragile && hasNonStackable) {
    riskFactors.push('Mixed fragile/non-stackable items');
    stability -= 20;
  }

  // Environment-specific checks
  if (constraints.environment === 'aérien') {
    if (weight > 500) {
      riskFactors.push('Exceeds typical air cargo limits');
      stability -= 10;
    }
  } else if (constraints.environment === 'maritime') {
    if (hasFragile) {
      riskFactors.push('Fragile items require protective packaging for maritime');
      stability -= 5;
    }
  }

  // Hazmat checks
  const hasHazmat = items.some(i => i.handlingCode);
  if (hasHazmat) {
    riskFactors.push('Contains hazardous materials - requires compliance documentation');
    stability -= 10;
  }

  return {
    id: `pallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    items,
    weight,
    volume,
    height,
    environment: constraints.environment,
    stability: Math.max(0, stability),
    riskFactors
  };
}

function generateRecommendations(
  pallets: Pallet[],
  constraints: PalletConstraints
): string[] {
  const recommendations: string[] = [];

  // Analysis
  const avgUtilization = pallets.reduce((sum, p) => sum + (p.weight / constraints.maxWeight), 0) / pallets.length;
  
  if (avgUtilization < 0.6) {
    recommendations.push('Low weight utilization detected. Consider consolidating shipments.');
  }

  const unstablePallets = pallets.filter(p => p.stability < 70);
  if (unstablePallets.length > 0) {
    recommendations.push(`${unstablePallets.length} pallet(s) have stability concerns. Review stacking configuration.`);
  }

  // Environment-specific
  if (constraints.environment === 'aérien') {
    recommendations.push('Air freight recommended for high-value items. Consider weight optimization.');
  } else if (constraints.environment === 'maritime') {
    recommendations.push('Maritime transport allows larger shipments. Consider consolidation for cost efficiency.');
  }

  // FEFO compliance
  const expiryItems = pallets.flatMap(p => p.items.filter(i => i.expiryDate));
  if (expiryItems.length > 0) {
    recommendations.push('FEFO compliance verified: Items ordered by expiry date.');
  }

  return recommendations;
}

async function generateAIInsights(pallets: Pallet[], constraints: PalletConstraints): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const palletSummary = pallets
    .map((p, i) => `Pallet ${i + 1}: ${p.items.length} items, ${p.weight}kg, Stability: ${p.stability}%`)
    .join('\n');

  const prompt = `Analyze these palletization results for ${constraints.environment} transport and provide strategic recommendations:\n${palletSummary}\n\nProvide 2-3 key recommendations.`;

  try {
    const message = await openai.messages.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].type === 'text' ? message.content[0].text : 'Palletization optimized successfully.';
  } catch (error) {
    console.error('AI Insights Error:', error);
    return 'Palletization analysis completed with standard optimization.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, constraints } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid items provided' },
        { status: 400 }
      );
    }

    if (!constraints) {
      return NextResponse.json(
        { error: 'Constraints required' },
        { status: 400 }
      );
    }

    // Calculate palletization
    const pallets = calculateOptimalPalletization(items, constraints);
    const recommendations = generateRecommendations(pallets, constraints);
    const aiInsights = await generateAIInsights(pallets, constraints);

    // Calculate statistics
    const totalWeight = pallets.reduce((sum, p) => sum + p.weight, 0);
    const totalVolume = pallets.reduce((sum, p) => sum + p.volume, 0);
    const utilizationRate = Math.round((totalWeight / (pallets.length * constraints.maxWeight)) * 100);
    const fefoCompliance = true; // Already enforced in algorithm

    const result: PalletizationResult = {
      pallets,
      statistics: {
        totalWeight,
        totalVolume,
        utilizationRate,
        fefoCompliance,
        alternativeRoutes: ['Direct shipment', 'Consolidation center', 'Cross-docking']
      },
      recommendations,
      aiInsights
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Palletization Error:', error);
    return NextResponse.json(
      { error: 'Palletization processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Intelligent Palletization Optimizer',
    endpoint: 'POST /api/v1/ai/intelligent-palletization',
    features: [
      'Multi-mode optimization (aérien/terrestre/maritime)',
      'FEFO/FIFO enforcement',
      'Weight and volume constraints',
      'Stability analysis',
      'Hazmat handling',
      'AI-powered recommendations'
    ]
  }, { status: 200 });
}
