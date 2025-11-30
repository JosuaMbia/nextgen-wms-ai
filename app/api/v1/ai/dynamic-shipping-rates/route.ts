import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ShippingRateQuote {
  origin: string;
  destination: string;
  baseRate: number; // Base rate in USD per kg
  geopoliticalSurcharge: number; // % surcharge
  fuelSurcharge: number; // % surcharge
  securitySurcharge: number; // % surcharge
  totalRate: number; // Final rate in USD per kg
  riskFactors: string[];
  recommendations: string[];
  validUntil: string; // ISO date
}

function calculateBaseRate(originCode: string, destCode: string, weight: number): number {
  // Base rates by region pair (simplified)
  const baseRates: Record<string, number> = {
    'US_EU': 3.5,
    'US_ASIA': 4.2,
    'EU_ASIA': 3.8,
    'ASIA_SA': 2.9,
    'default': 4.0,
  };
  
  let routeKey = 'default';
  if ((originCode === 'US' || originCode === 'CA') && (destCode === 'DE' || destCode === 'UK')) {
    routeKey = 'US_EU';
  } else if ((originCode === 'US' || originCode === 'CA') && (destCode.startsWith('CN') || destCode === 'JP')) {
    routeKey = 'US_ASIA';
  }
  
  let rate = baseRates[routeKey] || baseRates['default'];
  // Volume discount for larger shipments
  if (weight > 1000) rate *= 0.92; // 8% discount
  if (weight > 5000) rate *= 0.88; // 12% discount
  
  return parseFloat(rate.toFixed(2));
}

function calculateGeopoliticalSurcharge(riskScore: number): number {
  // Surcharge % based on geopolitical risk
  if (riskScore < 25) return 0;
  if (riskScore < 50) return 5;
  if (riskScore < 75) return 15;
  return 30; // Critical risk
}

function calculateFuelSurcharge(originCode: string, destCode: string): number {
  // Simplified fuel surcharge based on distance
  // In production, use actual oil prices and distance data
  const distanceSurcharge: Record<string, number> = {
    'short': 3,   // Same region
    'medium': 8,  // Adjacent regions
    'long': 15,   // Transcontinental
  };
  
  const regionMap: Record<string, string> = {
    'US': 'NA', 'CA': 'NA', 'MX': 'NA',
    'UK': 'EU', 'DE': 'EU', 'FR': 'EU',
    'CN': 'ASIA', 'JP': 'ASIA', 'SG': 'ASIA',
  };
  
  const originRegion = regionMap[originCode] || 'default';
  const destRegion = regionMap[destCode] || 'default';
  
  if (originRegion === destRegion) return distanceSurcharge['short'];
  if ((originRegion === 'NA' && destRegion === 'EU') || (originRegion === 'EU' && destRegion === 'NA')) {
    return distanceSurcharge['medium'];
  }
  return distanceSurcharge['long'];
}

function calculateSecuritySurcharge(riskFactors: string[]): number {
  // Security surcharge based on identified risk factors
  let surcharge = 2; // Base 2% security fee
  
  if (riskFactors.includes('OFAC_RESTRICTED')) surcharge += 25;
  if (riskFactors.includes('HIGH_RISK_ROUTE')) surcharge += 10;
  if (riskFactors.includes('TERRORISM_ALERT')) surcharge += 15;
  if (riskFactors.includes('PIRACY_ZONE')) surcharge += 8;
  if (riskFactors.includes('CUSTOMS_SENSITIVE')) surcharge += 5;
  
  return Math.min(surcharge, 50); // Cap at 50%
}

function identifyRiskFactors(riskScore: number, routeBottlenecks: number): string[] {
  const factors: string[] = [];
  
  if (riskScore > 75) factors.push('HIGH_RISK_GEOPOLITICAL');
  if (routeBottlenecks > 2) factors.push('HIGH_RISK_ROUTE');
  if (riskScore > 50 && routeBottlenecks > 0) factors.push('COMBINED_RISK');
  
  // Simulate detection of specific threats
  if (Math.random() > 0.7) factors.push('CUSTOMS_SENSITIVE');
  
  return factors;
}

async function getAIPricingInsight(quote: ShippingRateQuote): Promise<string> {
  try {
    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Based on this shipping quote from ${quote.origin} to ${quote.destination} at $${quote.totalRate}/kg (base: $${quote.baseRate}, risk factors: ${quote.riskFactors.join(', ')}), provide a 1-sentence pricing recommendation for the logistics manager.`,
        },
      ],
      max_tokens: 80,
    });
    return message.choices[0]?.message?.content || 'No recommendation available';
  } catch (error) {
    return 'Pricing insight unavailable';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { origin, destination, weight = 500, geopoliticalRiskScore = 30, routeBottlenecks = 1 } = await req.json();
    
    if (!origin || !destination || !weight) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, destination, weight' },
        { status: 400 }
      );
    }
    
    const originCode = origin.toUpperCase().slice(0, 2);
    const destCode = destination.toUpperCase().slice(0, 2);
    
    // Calculate rate components
    const baseRate = calculateBaseRate(originCode, destCode, weight);
    const geoSurcharge = calculateGeopoliticalSurcharge(geopoliticalRiskScore);
    const fuelSurcharge = calculateFuelSurcharge(originCode, destCode);
    const riskFactors = identifyRiskFactors(geopoliticalRiskScore, routeBottlenecks);
    const securitySurcharge = calculateSecuritySurcharge(riskFactors);
    
    // Calculate final rate
    const totalSurchargePercent = geoSurcharge + fuelSurcharge + securitySurcharge;
    const totalRate = baseRate * (1 + totalSurchargePercent / 100);
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (geoSurcharge > 10) {
      recommendations.push('High geopolitical risk detected - consider insurance');
    }
    if (fuelSurcharge > 10) {
      recommendations.push('Fuel costs elevated - expedite booking if possible');
    }
    if (weight > 5000) {
      recommendations.push('Volume shipment eligible for consolidated container rates');
    }
    if (totalSurchargePercent > 30) {
      recommendations.push('Consider alternative routing or consolidation strategies');
    }
    
    // Get AI pricing insight
    const quote: ShippingRateQuote = {
      origin,
      destination,
      baseRate,
      geopoliticalSurcharge: geoSurcharge,
      fuelSurcharge,
      securitySurcharge,
      totalRate: parseFloat(totalRate.toFixed(2)),
      riskFactors,
      recommendations,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const aiInsight = await getAIPricingInsight(quote);
    recommendations.unshift(`🤖 AI: ${aiInsight}`);
    
    return NextResponse.json(quote, { status: 200 });
  } catch (error) {
    console.error('Dynamic shipping rates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
