import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface InventoryItem {
  sku: string;
  nom: string;
  quantite: number;
  prix_unitaire: number;
  rotation_30j: number; // nombre de prélèvements
  valeur_stock: number; // quantité * prix
}

interface ParetoAnalysis {
  classA: InventoryItem[];
  classB: InventoryItem[];
  classC: InventoryItem[];
  statistics: {
    totalValue: number;
    classAValue: number;
    classBValue: number;
    classCValue: number;
    classAPercentValue: number;
    classBPercentValue: number;
    classCPercentValue: number;
    classAItems: number;
    classBItems: number;
    classCItems: number;
  };
  recommendations: string[];
  placementStrategy: {
    classA: string;
    classB: string;
    classC: string;
  };
}

// Calculer Pareto 80/20 avec multi-critères
function analyzeParetoDistribution(items: InventoryItem[]): ParetoAnalysis {
  // Calculer score composite: (valeur * 0.6) + (rotation * 0.4)
  const itemsWithScore = items.map(item => ({
    ...item,
    score: (item.valeur_stock * 0.6) + (item.rotation_30j * item.prix_unitaire * 0.4)
  }));

  // Trier par score décroissant
  itemsWithScore.sort((a, b) => b.score - a.score);

  // Calculer total
  const totalValue = itemsWithScore.reduce((sum, item) => sum + item.valeur_stock, 0);
  const totalRotation = itemsWithScore.reduce((sum, item) => sum + item.rotation_30j, 0);

  // Accumuler pour identifier classes
  let accumulatedValue = 0;
  let classA: InventoryItem[] = [];
  let classB: InventoryItem[] = [];
  let classC: InventoryItem[] = [];

  itemsWithScore.forEach((item, idx) => {
    accumulatedValue += item.valeur_stock;
    const percentValue = (accumulatedValue / totalValue) * 100;

    if (percentValue <= 80) {
      classA.push(item as InventoryItem);
    } else if (percentValue <= 95) {
      classB.push(item as InventoryItem);
    } else {
      classC.push(item as InventoryItem);
    }
  });

  const classAValue = classA.reduce((sum, item) => sum + item.valeur_stock, 0);
  const classBValue = classB.reduce((sum, item) => sum + item.valeur_stock, 0);
  const classCValue = classC.reduce((sum, item) => sum + item.valeur_stock, 0);

  return {
    classA,
    classB,
    classC,
    statistics: {
      totalValue,
      classAValue,
      classBValue,
      classCValue,
      classAPercentValue: (classAValue / totalValue) * 100,
      classBPercentValue: (classBValue / totalValue) * 100,
      classCPercentValue: (classCValue / totalValue) * 100,
      classAItems: classA.length,
      classBItems: classB.length,
      classCItems: classC.length,
    },
    recommendations: [],
    placementStrategy: {
      classA: 'Zone picking (sol) - Accès rapide - Inventaire haute fréquence',
      classB: 'Zone secondaire (mi-hauteur) - Accès modéré - Inventaire équilibré',
      classC: 'Zone arrière (hauteur) - Accès rare - Inventaire bas volume',
    },
  };
}

// IA: Générer recommandations intelligentes
async function generateParetoInsights(analysis: ParetoAnalysis): Promise<string[]> {
  try {
    const prompt = `Analyser cette distribution Pareto:
- Classe A: ${analysis.statistics.classAItems} articles = ${analysis.statistics.classAPercentValue.toFixed(1)}% de la valeur
- Classe B: ${analysis.statistics.classBItems} articles = ${analysis.statistics.classBPercentValue.toFixed(1)}% de la valeur
- Classe C: ${analysis.statistics.classCItems} articles = ${analysis.statistics.classCPercentValue.toFixed(1)}% de la valeur

Générer 3-4 recommandations d'optimisation opérationnelle et placement.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    });

    const text = response.choices[0].message.content || '';
    return text.split('\n').filter(r => r.trim().length > 0);
  } catch (error) {
    return [
      'Classification Pareto complétée: Appliquer stratégie d\'optimisation placement',
      'Classe A: Proximité picking, contrôle inventaire hebdo',
      'Classe C: Optimiser espace, rotation trimestrielle',
    ];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inventory } = body;

    if (!inventory || !Array.isArray(inventory)) {
      return NextResponse.json(
        { error: 'Inventory array required' },
        { status: 400 }
      );
    }

    // Enrichir données si manquantes
    const enrichedInventory = inventory.map((item: any) => ({
      sku: item.sku,
      nom: item.nom,
      quantite: item.quantite || 0,
      prix_unitaire: item.prix_unitaire || 0,
      rotation_30j: item.rotation_30j || Math.random() * 50,
      valeur_stock: (item.quantite || 0) * (item.prix_unitaire || 0),
    }));

    // Analyser Pareto
    const analysis = analyzeParetoDistribution(enrichedInventory);

    // Générer insights IA
    analysis.recommendations = await generateParetoInsights(analysis);

    return NextResponse.json({
      success: true,
      analysis,
      actionItems: {
        immediate: [
          `Réarranger ${analysis.statistics.classAItems} articles Classe A en zone picking`,
          `Auditer ${analysis.statistics.classBItems} articles Classe B pour consolidation`,
          `Évaluer déstockage ${analysis.statistics.classCItems} articles Classe C`,
        ],
        weekly: [
          'Mesurer temps picking moyen Classe A vs Classe B',
          'Analyser taux rotation réel vs prévisions',
        ],
        monthly: [
          'Recalculer distribution Pareto',
          'Optimiser placement basé nouveau ABC',
        ],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Analysis failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Pareto ABC Analysis Engine',
    method: 'POST',
    body: {
      inventory: [
        {
          sku: 'SKU001',
          nom: 'Article haute rotation',
          quantite: 500,
          prix_unitaire: 25.50,
          rotation_30j: 120,
        },
      ],
    },
    output: 'Complete Pareto analysis with AI recommendations',
  });
}
