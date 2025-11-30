import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interfaces pour validation
interface Article {
  sku: string;
  nom: string;
  categorie: string;
  prix: number;
  poids: number;
  dimensions: string;
  datePeremption?: string;
  dateStockage: string;
  quantite: number;
  fournisseur: string;
}

interface Emplacement {
  code: string;
  zone: string;
  niveau: 'sol' | 'hauteur' | 'picking';
  capacite: number;
  capaciteUtilisee: number;
  temperature?: number;
  humidite?: number;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: Array<{ row: number; errors: string[] }>;
  aiAnalysis?: {
    recommendations: string[];
    riskAlerts: string[];
    optimizations: string[];
  };
  data?: any[];
}

// Validation des articles avec logique FIFO/FEFO
function validateAndEnrichArticle(row: any, rowIndex: number): { valid: Article | null; errors: string[] } {
  const errors: string[] = [];
  
  // Validations obligatoires
  if (!row.sku || row.sku.trim() === '') errors.push('SKU manquant');
  if (!row.nom || row.nom.trim() === '') errors.push('Nom manquant');
  if (!row.categorie) errors.push('Catégorie manquante');
  if (!row.prix || isNaN(parseFloat(row.prix))) errors.push('Prix invalide');
  if (!row.quantite || isNaN(parseInt(row.quantite))) errors.push('Quantité invalide');
  if (!row.dateStockage) errors.push('Date de stockage manquante');
  
  // Validation dates
  const dateStockage = new Date(row.dateStockage);
  if (isNaN(dateStockage.getTime())) errors.push('Date de stockage invalide (format: YYYY-MM-DD)');
  
  if (row.datePeremption) {
    const datePeremption = new Date(row.datePeremption);
    if (isNaN(datePeremption.getTime())) errors.push('Date de péremption invalide');
  }
  
  if (errors.length > 0) {
    return { valid: null, errors };
  }
  
  // Déterminer stratégie FIFO/FEFO
  const hasExpiry = !!row.datePeremption && row.datePeremption.trim() !== '';
  
  const article: Article = {
    sku: row.sku.trim(),
    nom: row.nom.trim(),
    categorie: row.categorie.trim(),
    prix: parseFloat(row.prix),
    poids: parseFloat(row.poids || 0),
    dimensions: row.dimensions || 'N/A',
    datePeremption: hasExpiry ? row.datePeremption : undefined,
    dateStockage: row.dateStockage,
    quantite: parseInt(row.quantite),
    fournisseur: row.fournisseur || 'Non spécifié',
  };
  
  return { valid: article, errors: [] };
}

// Validation des emplacements
function validateEmplacement(row: any, rowIndex: number): { valid: Emplacement | null; errors: string[] } {
  const errors: string[] = [];
  
  if (!row.code) errors.push('Code emplacement manquant');
  if (!row.zone) errors.push('Zone manquante');
  if (!row.niveau || !['sol', 'hauteur', 'picking'].includes(row.niveau.toLowerCase())) 
    errors.push('Niveau invalide (sol/hauteur/picking)');
  if (!row.capacite || isNaN(parseFloat(row.capacite))) errors.push('Capacité invalide');
  
  if (errors.length > 0) {
    return { valid: null, errors };
  }
  
  const emplacement: Emplacement = {
    code: row.code.trim(),
    zone: row.zone.trim(),
    niveau: row.niveau.toLowerCase() as 'sol' | 'hauteur' | 'picking',
    capacite: parseFloat(row.capacite),
    capaciteUtilisee: parseFloat(row.capaciteUtilisee || 0),
    temperature: row.temperature ? parseFloat(row.temperature) : undefined,
    humidite: row.humidite ? parseFloat(row.humidite) : undefined,
  };
  
  return { valid: emplacement, errors: [] };
}

// IA: Analyser les données et fournir recommandations
async function analyzeImportWithAI(data: any[], type: string): Promise<any> {
  try {
    const summary = {
      type,
      count: data.length,
      sample: data.slice(0, 3),
    };
    
    const aiPrompt = `Analyser ces données d'importation WMS et fournir:
1. Recommandations d'optimisation
2. Risques identifiés
3. Opportunités FIFO/FEFO

Données: ${JSON.stringify(summary)}

Répondre en JSON: { recommendations: [], riskAlerts: [], optimizations: [] }`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: aiPrompt }],
      temperature: 0.7,
    });
    
    try {
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch {
      return {
        recommendations: ['Analyse IA: données importées avec succès'],
        riskAlerts: [],
        optimizations: [],
      };
    }
  } catch (error) {
    return {
      recommendations: [],
      riskAlerts: ['Analyse IA temporairement indisponible'],
      optimizations: [],
    };
  }
}

// Route POST pour import
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string; // 'articles' | 'emplacements' | 'entrepots'
    
    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }
    
    if (!importType) {
      return NextResponse.json({ error: 'Type d\'import manquant' }, { status: 400 });
    }
    
    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
    });
    
    const result: ImportResult = {
      success: true,
      totalRows: records.length,
      validRows: 0,
      invalidRows: [],
      data: [],
    };
    
    // Traiter selon le type
    if (importType === 'articles') {
      records.forEach((row: any, index: number) => {
        const { valid, errors } = validateAndEnrichArticle(row, index);
        if (valid) {
          result.validRows++;
          result.data!.push(valid);
        } else if (errors.length > 0) {
          result.invalidRows.push({ row: index + 1, errors });
        }
      });
    } else if (importType === 'emplacements') {
      records.forEach((row: any, index: number) => {
        const { valid, errors } = validateEmplacement(row, index);
        if (valid) {
          result.validRows++;
          result.data!.push(valid);
        } else if (errors.length > 0) {
          result.invalidRows.push({ row: index + 1, errors });
        }
      });
    }
    
    // IA: Analyser et enrichir
    if (result.data && result.data.length > 0) {
      result.aiAnalysis = await analyzeImportWithAI(result.data, importType);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors du traitement du fichier', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Route GET pour télécharger templates
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('template');
  
  if (type === 'articles') {
    const template = `sku,nom,categorie,prix,poids,dimensions,datePeremption,dateStockage,quantite,fournisseur
SKU001,Article Test,Catégorie A,15.99,0.5,10x10x5,2025-12-31,2025-01-01,100,Fournisseur A
`;
    return new NextResponse(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=template_articles.csv',
      },
    });
  } else if (type === 'emplacements') {
    const template = `code,zone,niveau,capacite,capaciteUtilisee,temperature,humidite
A-SOL-001,Zone A,sol,500,250,20,45
A-HAUTEUR-001,Zone A,hauteur,300,150,20,45
`;
    return new NextResponse(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=template_emplacements.csv',
      },
    });
  }
  
  return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 });
}
