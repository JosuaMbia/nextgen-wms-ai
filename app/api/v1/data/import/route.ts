import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Parser CSV simple sans dépendance externe
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/\"/g, ''));
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/\"/g, ''));
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }
  
  return records;
}

// Mapping automatique avec IA
async function mapColumnsWithAI(headers: string[], targetType: string): Promise<Record<string, string>> {
  const targetFields: Record<string, string[]> = {
    articles: ['sku', 'nom', 'categorie', 'prix', 'poids', 'dimensions', 'datePeremption', 'dateStockage', 'quantite', 'fournisseur'],
    emplacements: ['code', 'zone', 'niveau', 'capacite', 'capaciteUtilisee', 'temperature', 'humidite'],
    entrepots: ['nom', 'adresse', 'ville', 'codePostal', 'pays', 'capaciteTotale']
  };

  const targetFieldsList = targetFields[targetType as keyof typeof targetFields] || [];
  
  const prompt = `Tu es un assistant IA expert en mapping de données.
Mappe automatiquement ces colonnes d'un fichier importé vers les champs requis du système.

Colonnes du fichier: ${JSON.stringify(headers)}
Champs du système pour "${targetType}": ${JSON.stringify(targetFieldsList)}

Règles:
- Trouve la meilleure correspondance pour chaque champ du système
- Ignore la casse et les accents
- Accepte les synonymes (ex: "Référence" = "sku", "Produit" = "nom")
- Si aucune correspondance, mets null

Réponds UNIQUEMENT avec un JSON valide au format:
{ "champSysteme": "colonneF fichier" }

Exemple: { "sku": "Reference", "nom": "Designation" }`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || '{}';
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.error('AI Mapping error:', error);
    // Fallback: mapping simple par correspondance exacte
    const mapping: Record<string, string> = {};
    targetFieldsList.forEach(field => {
      const match = headers.find(h => h.toLowerCase() === field.toLowerCase());
      if (match) mapping[field] = match;
    });
    return mapping;
  }
}

// Transformation des données mappées
function transformData(records: Record<string, string>[], mapping: Record<string, string>, targetType: string): any[] {
  return records.map(record => {
    const transformed: any = {};
    
    Object.keys(mapping).forEach(targetField => {
      const sourceField = mapping[targetField];
      if (sourceField && record[sourceField] !== undefined) {
        let value = record[sourceField];
        
        // Conversions de types automatiques
        if (['prix', 'poids', 'capacite', 'capaciteUtilisee', 'temperature', 'humidite'].includes(targetField)) {
          transformed[targetField] = parseFloat(value) || 0;
        } else if (['quantite'].includes(targetField)) {
          transformed[targetField] = parseInt(value) || 0;
        } else {
          transformed[targetField] = value;
        }
      }
    });
    
    return transformed;
  }).filter(item => Object.keys(item).length > 0);
}

// Validation avec logique métier
interface ValidationResult {
  valid: any | null;
  errors: string[];
}

function validateArticle(row: any, index: number): ValidationResult {
  const errors: string[] = [];
  
  if (!row.sku) errors.push('SKU manquant');
  if (!row.nom) errors.push('Nom manquant');
  if (!row.categorie) errors.push('Catégorie manquante');
  if (row.prix === undefined || isNaN(row.prix)) errors.push('Prix invalide');
  if (row.quantite === undefined || isNaN(row.quantite)) errors.push('Quantité invalide');
  
  if (errors.length > 0) {
    return { valid: null, errors };
  }
  
  return { valid: row, errors: [] };
}

function validateEmplacement(row: any, index: number): ValidationResult {
  const errors: string[] = [];
  
  if (!row.code) errors.push('Code emplacement manquant');
  if (!row.zone) errors.push('Zone manquante');
  if (!['sol', 'hauteur', 'picking'].includes(row.niveau?.toLowerCase())) {
    errors.push('Niveau invalide (sol/hauteur/picking)');
  }
  if (row.capacite === undefined || isNaN(row.capacite)) errors.push('Capacité invalide');
  
  if (errors.length > 0) {
    return { valid: null, errors };
  }
  
  // Normaliser le niveau
  row.niveau = row.niveau.toLowerCase();
  
  return { valid: row, errors: [] };
}

// IA: Analyser et recommander
async function analyzeImportWithAI(data: any[], type: string, mapping: Record<string, string>): Promise<any> {
  try {
    const summary = {
      type,
      count: data.length,
      mapping,
      sample: data.slice(0, 2),
    };
    
    const aiPrompt = `Analyse ces données WMS importées et fournis:
1. Recommandations d'optimisation
2. Risques identifiés
3. Opportunités FIFO/FEFO

Mapping utilisé: ${JSON.stringify(mapping)}
Données: ${JSON.stringify(summary)}

Réponds en JSON: { recommendations: [], riskAlerts: [], optimizations: [] }`;
    
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
    const importType = formData.get('type') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }
    
    if (!importType) {
      return NextResponse.json({ error: "Type d'import manquant" }, { status: 400 });
    }
    
    // 1. Lire et parser le fichier
// Déterminer le format du fichier
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    let records: Record<string, string>[] = [];

    if (fileExt === 'csv') {
      // Parse CSV
      const text = await file.text();
      records = parseCSV(text);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      // Parse Excel avec SheetJS
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0].map((h: any) => String(h || '').trim());
        records = jsonData.slice(1).map(row => {
          const record: Record<string, string> = {};
          headers.forEach((header, index) => {
            record[header] = row[index] != null ? String(row[index]) : '';
          });
          return record;
        }).filter(r => Object.keys(r).length > 0);
      }
    } else {
      return NextResponse.json({ error: 'Format non supporté. Utilisez .xlsx, .xls ou .csv' }, { status: 400 });
    }
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'Fichier vide ou format invalide' }, { status: 400 });
    }
    
    // 2. Mapper les colonnes automatiquement avec l'IA
    const headers = Object.keys(records[0]);
        const manualMapping = formData.get('mapping');
    const mapping = manualMapping 
      ? JSON.parse(manualMapping as string)
      : await mapColumnsWithAI(headers, importType);
    
    // 3. Transformer les données selon le mapping
    const transformedData = transformData(records, mapping, importType);
    
    // 4. Valider les données
    const result: any = {
      success: true,
      totalRows: transformedData.length,
      validRows: 0,
      invalidRows: [],
      mapping: mapping,
      data: [],
    };
    
    const validateFn = importType === 'articles' ? validateArticle : validateEmplacement;
    
    transformedData.forEach((row: any, index: number) => {
      const { valid, errors } = validateFn(row, index);
      if (valid) {
        result.validRows++;
        result.data.push(valid);
      } else if (errors.length > 0) {
        result.invalidRows.push({ row: index + 1, errors });
      }
    });
    
    // 5. Analyse IA
    if (result.data && result.data.length > 0) {
      result.aiAnalysis = await analyzeImportWithAI(result.data, importType, mapping);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
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
