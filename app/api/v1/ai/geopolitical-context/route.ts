import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OFAC Sanctions List - Curated high-risk countries and entities
const OFAC_RESTRICTED_COUNTRIES = [
  'IR', // Iran
  'KP', // North Korea
  'SY', // Syria
  'CU', // Cuba
  'VE', // Venezuela
];

const ROUTE_BOTTLENECKS = [
  { region: 'Suez Canal', riskLevel: 'HIGH', impactDays: 14 },
  { region: 'Panama Canal', riskLevel: 'MEDIUM', impactDays: 7 },
  { region: 'Taiwan Strait', riskLevel: 'HIGH', impactDays: 21 },
  { region: 'Strait of Hormuz', riskLevel: 'HIGH', impactDays: 10 },
  { region: 'Red Sea', riskLevel: 'MEDIUM', impactDays: 8 },
  { region: 'Black Sea', riskLevel: 'MEDIUM', impactDays: 12 },
];

interface GeopoliticalAssessment {
  originCountry: string;
  destinationCountry: string;
  hasOfacRestrictions: boolean;
  routeBottlenecks: Array<{
    name: string;
    riskLevel: string;
    impactDays: number;
    avoidanceOptions: string[];
  }>;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
  estimatedDelayDays: number;
  alternativeRoutesAvailable: boolean;
  costIncreasePercent: number;
  complianceNotes: string[];
}

function getCountryRiskScore(countryCode: string): number {
  const riskScores: Record<string, number> = {
    'IR': 95, 'KP': 98, 'SY': 90, 'CU': 85, 'VE': 80,
    'UA': 75, 'RU': 70, 'BY': 68, 'MM': 60, 'TL': 55,
    'US': 15, 'CA': 10, 'JP': 12, 'DE': 8, 'UK': 9,
    'FR': 10, 'SG': 12, 'AU': 8, 'NZ': 7, 'CH': 5,
  };
  return riskScores[countryCode] || 40;
}

function assessRouteBottlenecks(originCode: string, destCode: string): Array<{
  name: string;
  riskLevel: string;
  impactDays: number;
  avoidanceOptions: string[];
}> {
  const shippingRoutes: Record<string, string[]> = {
    'ASIA_TO_EUROPE': ['Suez Canal', 'Red Sea', 'Strait of Hormuz'],
    'ASIA_PACIFIC': ['Taiwan Strait', 'Strait of Malacca'],
    'AMERICAS_ASIA': ['Panama Canal'],
    'EUROPE_AMERICAS': [],
    'MIDDLE_EAST': ['Strait of Hormuz', 'Red Sea'],
  };
  let routeKey = 'EUROPE_AMERICAS';
  if ((originCode.startsWith('CN') || originCode.startsWith('JP')) && (destCode.startsWith('DE') || destCode.startsWith('UK'))) {
    routeKey = 'ASIA_TO_EUROPE';
  } else if (originCode.startsWith('SG') && (destCode.startsWith('US') || destCode.startsWith('CA'))) {
    routeKey = 'ASIA_PACIFIC';
  }
  const routeNames = shippingRoutes[routeKey] || [];
  return ROUTE_BOTTLENECKS.filter(b => routeNames.includes(b.region)).map(b => ({
    name: b.region,
    riskLevel: b.riskLevel,
    impactDays: b.impactDays,
    avoidanceOptions: getAvoidanceOptions(b.region),
  }));
}

function getAvoidanceOptions(bottleneck: string): string[] {
  const avoidanceMap: Record<string, string[]> = {
    'Suez Canal': ['Cape of Good Hope Route', 'Arctic Route (seasonal)'],
    'Panama Canal': ['Cape Horn Route', 'Around Africa'],
    'Taiwan Strait': ['South China Sea Route', 'Luzon Strait'],
    'Strait of Hormuz': ['Sumed Pipeline (oil)', 'Extended sea route'],
    'Red Sea': ['Around Africa', 'Through Suez (if available)'],
    'Black Sea': ['Mediterranean Route', 'Overland'],
  };
  return avoidanceMap[bottleneck] || ['Alternative routing available'];
}

function calculateRiskScore(originCode: string, destCode: string, bottlenecks: Array<{ riskLevel: string }>): number {
  const originRisk = getCountryRiskScore(originCode);
  const destRisk = getCountryRiskScore(destCode);
  let bottleneckRisk = 0;
  if (bottlenecks.length > 0) {
    const highRiskBottlenecks = bottlenecks.filter(b => b.riskLevel === 'HIGH').length;
    const mediumRiskBottlenecks = bottlenecks.filter(b => b.riskLevel === 'MEDIUM').length;
    bottleneckRisk = (highRiskBottlenecks * 25) + (mediumRiskBottlenecks * 12);
  }
  const score = (originRisk * 0.25) + (destRisk * 0.25) + (bottleneckRisk * 0.5);
  return Math.min(100, Math.round(score));
}

function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

function estimateDelay(bottlenecks: Array<{ impactDays: number }>, riskScore: number): number {
  const bottleneckDelay = bottlenecks.reduce((sum, b) => sum + b.impactDays, 0) * 0.3;
  const riskDelay = (riskScore / 100) * 5;
  return Math.round(bottleneckDelay + riskDelay);
}

function generateRecommendations(assessment: Partial<GeopoliticalAssessment>, originCode: string, destCode: string): string[] {
  const recommendations: string[] = [];
  if (assessment.hasOfacRestrictions) {
    recommendations.push('🚫 BLOCKED: This shipment violates OFAC restrictions. Route prohibited.');
  }
  if (assessment.riskLevel === 'CRITICAL') {
    recommendations.push('⚠️ CRITICAL: Consider air freight or alternative routing.');
    recommendations.push('📞 Escalate to compliance and supply chain teams.');
  } else if (assessment.riskLevel === 'HIGH') {
    recommendations.push('⚠️ HIGH RISK: Monitor situation daily. Have backup routes ready.');
    recommendations.push('💰 Consider freight insurance for this shipment.');
  } else if (assessment.riskLevel === 'MEDIUM') {
    recommendations.push('ℹ️ MEDIUM RISK: Standard protocols apply. Track closely.');
    recommendations.push('📊 Monitor geopolitical news for escalations.');
  }
  if (assessment.alternativeRoutesAvailable) {
    recommendations.push('🛤️ Alternative routes available. Evaluate cost vs. time tradeoff.');
  }
  if (assessment.costIncreasePercent! > 10) {
    recommendations.push(`💵 Route premiums may increase by ~${Math.round(assessment.costIncreasePercent!)}%`);
  }
  return recommendations;
}

async function getAIIntelligence(originCode: string, destCode: string, riskScore: number, bottlenecks: Array<{ name: string; riskLevel: string }>): Promise<string> {
  try {
    const bottleneckSummary = bottlenecks.map(b => `${b.name} (${b.riskLevel})`).join(', ');
    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Provide a 2-sentence executive summary for a logistics professional about shipping from ${originCode} to ${destCode}. Risk Score: ${riskScore}/100. Bottlenecks: ${bottleneckSummary || 'None identified'}. Focus on actionable insights.`,
        },
      ],
      max_tokens: 150,
    });
    return message.choices[0]?.message?.content || 'AI assessment unavailable';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Unable to generate AI assessment at this time';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { originCountry, destinationCountry } = await req.json();
    if (!originCountry || !destinationCountry) {
      return NextResponse.json({ error: 'Missing originCountry or destinationCountry' }, { status: 400 });
    }
    const originCode = originCountry.toUpperCase().slice(0, 2);
    const destCode = destinationCountry.toUpperCase().slice(0, 2);
    const hasOfacRestrictions = OFAC_RESTRICTED_COUNTRIES.includes(originCode) || OFAC_RESTRICTED_COUNTRIES.includes(destCode);
    if (hasOfacRestrictions) {
      const assessment: GeopoliticalAssessment = {
        originCountry,
        destinationCountry,
        hasOfacRestrictions: true,
        routeBottlenecks: [],
        overallRiskScore: 100,
        riskLevel: 'CRITICAL',
        recommendedActions: ['🚫 BLOCKED: OFAC sanctions restrict this route.'],
        estimatedDelayDays: 0,
        alternativeRoutesAvailable: false,
        costIncreasePercent: 0,
        complianceNotes: ['OFAC violation detected', 'Shipment must be rejected'],
      };
      return NextResponse.json(assessment, { status: 200 });
    }
    const bottlenecks = assessRouteBottlenecks(originCode, destCode);
    const riskScore = calculateRiskScore(originCode, destCode, bottlenecks);
    const riskLevel = getRiskLevel(riskScore);
    const estimatedDelayDays = estimateDelay(bottlenecks, riskScore);
    const alternativeRoutesAvailable = bottlenecks.length > 0 || riskScore > 40;
    const costIncreasePercent = Math.round((riskScore / 100) * 25);
    const partialAssessment: Partial<GeopoliticalAssessment> = {
      hasOfacRestrictions,
      riskLevel,
      alternativeRoutesAvailable,
      costIncreasePercent,
    };
    const recommendedActions = generateRecommendations(partialAssessment, originCode, destCode);
    const aiIntelligence = await getAIIntelligence(originCode, destCode, riskScore, bottlenecks);
    recommendedActions.unshift(`🤖 AI Analysis: ${aiIntelligence}`);
    const assessment: GeopoliticalAssessment = {
      originCountry,
      destinationCountry,
      hasOfacRestrictions,
      routeBottlenecks: bottlenecks,
      overallRiskScore: riskScore,
      riskLevel,
      recommendedActions,
      estimatedDelayDays,
      alternativeRoutesAvailable,
      costIncreasePercent,
      complianceNotes: [
        'Assessment based on current geopolitical conditions',
        'OFAC restrictions enforced',
        'Route bottlenecks evaluated',
        'Risk factors integrated with AI analysis',
      ],
    };
    return NextResponse.json(assessment, { status: 200 });
  } catch (error) {
    console.error('Geopolitical context API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
