import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OrderItem {
  sku: string;
  quantite: number;
  datePeremption?: string;
  poids?: number;
}

interface InventoryItem {
  sku: string;
  emplacementCode: string;
  quantite: number;
  zone: string;
  niveau: 'sol' | 'hauteur' | 'picking';
  datePeremption?: string;
  dateStockage: string;
  poids?: number;
}

interface PickingRecommendation {
  sku: string;
  quantiteRequise: number;
  recommendations: Array<{
    emplacementCode: string;
    zone: string;
    niveau: string;
    quantiteAPreleveR: number;
    priorite: number; // 1 = plus prioritaire
    raison: string; // FIFO, FEFO, ou ergonomique
    joursRestantsAvantExpiration?: number;
  }>;
  alertes: string[];
}

interface OptimizationResult {
  commandeId: string;
  tempsEstime: number; // en minutes
  distanceEstimee: number; // en mètres
  prioriteFIFO_FEFO: 'FIFO' | 'FEFO' | 'MIXED';
  recommandations: PickingRecommendation[];
  strategieZones: {
    prioritereSol: boolean;
    raisons: string[];
  };
  avertissements: Array<{
    type: 'expiration_proche' | 'rupture_stock' | 'zone_encombree';
    message: string;
  }>;
  aiInsights: string;
}

// Calcul FIFO/FEFO avancé
function calculatePriority(
  items: InventoryItem[],
  orderItem: OrderItem,
  needFIFO: boolean
): PickingRecommendation {
  // Filtrer les articles correspondants
  const availableItems = items.filter(i => i.sku === orderItem.sku && i.quantite > 0);
  
  if (availableItems.length === 0) {
    return {
      sku: orderItem.sku,
      quantiteRequise: orderItem.quantite,
      recommendations: [],
      alertes: [`Stock insuffisant pour ${orderItem.sku}`],
    };
  }
  
  // Trier selon stratégie
  const sorted = needFIFO
    ? availableItems.sort((a, b) => new Date(a.dateStockage).getTime() - new Date(b.dateStockage).getTime())
    : availableItems.sort((a, b) => {
        const dateA = a.datePeremption ? new Date(a.datePeremption).getTime() : Infinity;
        const dateB = b.datePeremption ? new Date(b.datePeremption).getTime() : Infinity;
        return dateA - dateB;
      });
  
  // Prioriser articles au sol
  const solItems = sorted.filter(i => i.niveau === 'sol');
  const otherItems = sorted.filter(i => i.niveau !== 'sol');
  const prioritizedItems = [...solItems, ...otherItems];
  
  const recommendations = [];
  let quantiteRestante = orderItem.quantite;
  let priorite = 1;
  
  for (const item of prioritizedItems) {
    if (quantiteRestante <= 0) break;
    
    const quantiteAPreleveR = Math.min(quantiteRestante, item.quantite);
    const joursRestants = item.datePeremption
      ? Math.ceil((new Date(item.datePeremption).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : undefined;
    
    recommendations.push({
      emplacementCode: item.emplacementCode,
      zone: item.zone,
      niveau: item.niveau,
      quantiteAPreleveR,
      priorite: priorite++,
      raison: needFIFO 
        ? 'FIFO' 
        : joursRestants !== undefined && joursRestants < 30
        ? 'FEFO (Expiration proche)'
        : 'FEFO',
      joursRestantsAvantExpiration: joursRestants,
    });
    
    quantiteRestante -= quantiteAPreleveR;
  }
  
  return {
    sku: orderItem.sku,
    quantiteRequise: orderItem.quantite,
    recommendations,
    alertes: quantiteRestante > 0 ? [`Stock manquant: ${quantiteRestante} unités`] : [],
  };
}

// IA: Analyser l'ordre et fournir insights
async function generateAIInsights(order: OrderItem[], optimizations: OptimizationResult): Promise<string> {
  try {
    const prompt = `Analyser cette optimisation de picking WMS:
- Commande: ${order.length} articles
- Temps estimé: ${optimizations.tempsEstime} minutes
- Stratégie: ${optimizations.prioriteFIFO_FEFO}
- Avertissements: ${optimizations.avertissements.length}

Fournir 2-3 recommandations d'optimisation courtes et actionables:`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });
    
    return response.choices[0].message.content || 'Optimisation calculée';
  } catch {
    return 'Optimisation calculée avec succès';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, items, inventory, useFIFO = false } = body;
    
    if (!items || !Array.isArray(items) || !inventory || !Array.isArray(inventory)) {
      return NextResponse.json(
        { error: 'Structure de données invalide' },
        { status: 400 }
      );
    }
    
    const recommendations = items.map((item: OrderItem) =>
      calculatePriority(inventory as InventoryItem[], item, useFIFO)
    );
    
    // Calculer temps et distance estimés
    const totalQuantite = items.reduce((sum, item) => sum + item.quantite, 0);
    const tempsEstime = Math.ceil(totalQuantite * 1.5 + recommendations.length * 2);
    const distanceEstimee = recommendations.reduce((sum, rec) => {
      return sum + rec.recommendations.length * 15; // 15m par localisation
    }, 0);
    
    // Stratégie FIFO/FEFO
    const hasExpiration = inventory.some(i => i.datePeremption);
    const prioriteFIFO_FEFO = hasExpiration && !useFIFO ? 'FEFO' : useFIFO ? 'FIFO' : 'MIXED';
    
    // Avertissements
    const avertissements = [];
    const itemsWithExpiringSoon = recommendations.filter(r =>
      r.recommendations.some(rec => rec.joursRestantsAvantExpiration && rec.joursRestantsAvantExpiration < 7)
    );
    
    if (itemsWithExpiringSoon.length > 0) {
      avertissements.push({
        type: 'expiration_proche' as const,
        message: `${itemsWithExpiringSoon.length} article(s) expire(nt) dans moins de 7 jours`,
      });
    }
    
    const stockInsuffisant = recommendations.filter(r => r.alertes.length > 0);
    if (stockInsuffisant.length > 0) {
      avertissements.push({
        type: 'rupture_stock' as const,
        message: `Stock insuffisant pour ${stockInsuffisant.length} article(s)`,
      });
    }
    
    const result: OptimizationResult = {
      commandeId: orderId || `CMD-${Date.now()}`,
      tempsEstime,
      distanceEstimee,
      prioriteFIFO_FEFO,
      recommandations: recommendations,
      strategieZones: {
        prioritereSol: true,
        raisons: [
          'Optimisation ergonomique du picking',
          'Réduction des mouvements hauteur/profondeur',
          'Respect de la capacité cervicale du préparateur',
        ],
      },
      avertissements,
      aiInsights: await generateAIInsights(items, {} as any),
    };
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de l\'optimisation', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET: Récupérer historique d'optimisations
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API d\'optimisation du picking FIFO/FEFO',
    endpoints: {
      POST: 'Optimiser un picking',
      params: {
        orderId: 'ID de la commande',
        items: 'Array des articles à prélever',
        inventory: 'Array de l\'inventaire disponible',
        useFIFO: 'Utiliser FIFO (true) ou FEFO (false)',
      },
    },
  });
}
