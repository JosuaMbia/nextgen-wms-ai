'use client';

import { useState } from 'react';
import { Upload, Download, Check, AlertCircle, Loader, ArrowRight, ArrowLeft } from 'lucide-react';

interface ImportStatus {
  success: boolean;
  message: string;
  details?: string;
}

type TabType = 'import' | 'export';
type MappingStep = 'upload' | 'mapping' | 'importing';

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('import');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [fileName, setFileName] = useState('');
  const [importType, setImportType] = useState<string>('articles');
  
  const [mappingStep, setMappingStep] = useState<MappingStep>('upload');
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);

  const targetFields: Record<string, Array<{value: string, label: string}>> = {
    articles: [
      { value: '', label: '-- Ne pas importer --' },
      { value: 'sku', label: 'SKU / Référence' },
      { value: 'nom', label: 'Nom / Désignation' },
      { value: 'categorie', label: 'Catégorie' },
      { value: 'prix', label: 'Prix' },
      { value: 'poids', label: 'Poids' },
      { value: 'dimensions', label: 'Dimensions' },
      { value: 'datePeremption', label: 'Date péremption' },
      { value: 'dateStockage', label: 'Date stockage' },
      { value: 'quantite', label: 'Quantité' },
      { value: 'fournisseur', label: 'Fournisseur' },
    ],
    emplacements: [
      { value: '', label: '-- Ne pas importer --' },
      { value: 'code', label: 'Code emplacement' },
      { value: 'zone', label: 'Zone' },
      { value: 'niveau', label: 'Niveau (sol/hauteur/picking)' },
      { value: 'capacite', label: 'Capacité' },
      { value: 'capaciteUtilisee', label: 'Capacité utilisée' },
      { value: 'temperature', label: 'Température' },
      { value: 'humidite', label: 'Humidité' },
    ],
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setStatus(null);
      setMappingStep('upload');
    }
  };

  const handleAnalyzeFile = async () => {
    if (!file) {
      setStatus({ success: false, message: 'Veuillez sélectionner un fichier' });
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setStatus({ success: false, message: 'Fichier vide' });
        setLoading(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setDetectedColumns(headers);

      const preview = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      setPreviewData(preview);

      const initialMapping: Record<string, string> = {};
      headers.forEach(header => {
        initialMapping[header] = '';
      });
      setColumnMapping(initialMapping);

      setMappingStep('mapping');
      setLoading(false);
    } catch (error) {
      setStatus({
        success: false,
        message: '❌ Erreur lors de la lecture du fichier',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
      setLoading(false);
    }
  };

  const handleFinalImport = async () => {
    if (!file) return;

    const reversedMapping: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([fileCol, systemField]) => {
      if (systemField && systemField !== '') {
        reversedMapping[systemField] = fileCol;
      }
    });

    const requiredFields = importType === 'articles' 
      ? ['sku', 'nom', 'categorie', 'prix', 'quantite']
      : ['code', 'zone', 'niveau', 'capacite'];

    const missingFields = requiredFields.filter(field => !reversedMapping[field]);
    if (missingFields.length > 0) {
      setStatus({
        success: false,
        message: '❌ Champs obligatoires manquants',
        details: `Veuillez mapper: ${missingFields.join(', ')}`,
      });
      return;
    }

    setLoading(true);
    setMappingStep('importing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);
      formData.append('mapping', JSON.stringify(reversedMapping));

      const response = await fetch('/api/v1/data/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          success: true,
          message: `✅ Import réussi : ${data.validRows} lignes validées`,
          details: data.invalidRows?.length > 0 ? `${data.invalidRows.length} erreurs` : 'Aucune erreur',
        });
        setMappingStep('upload');
        setFile(null);
        setFileName('');
        setColumnMapping({});
        setDetectedColumns([]);
        setPreviewData([]);
      } else {
        setStatus({
          success: false,
          message: `❌ ${data.error || 'Erreur'}`,
          details: data.details || '',
        });
        setMappingStep('mapping');
      }
    } catch (error) {
      setStatus({
        success: false,
        message: '❌ Erreur de connexion',
        details: error instanceof Error ? error.message : '',
      });
      setMappingStep('mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (dataType: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/data/export/${dataType}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setStatus({
          success: true,
          message: `✅ Export de ${dataType} réussi!`,
          details: 'Le fichier a été téléchargé avec succès',
        });
      } else {
        setStatus({
          success: false,
          message: `❌ Erreur lors de l'export`,
          details: 'Impossible de télécharger le fichier',
        });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: '❌ Erreur de connexion',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Import/Export de Données</h2>
        <p className="text-slate-400 mt-2">Gérez vos données de manière simple et efficace</p>
      </div>

      <div className="flex space-x-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'import'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Upload className="w-5 h-5 inline mr-2" />
          Importer des Données
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'export'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Download className="w-4 h-4 inline mr-2" />
          Exporter des Données
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          {mappingStep === 'upload' && (
            <>
              <div className="text-center mb-8">
                <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Importer les Données</h2>
                <p className="text-slate-400">Importez votre fichier Excel ou CSV</p>
              </div>

              <div className="mb-6">
                <label className="block mb-3 text-slate-300 font-medium">Type de données à importer</label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="articles">Articles / Produits</option>
                  <option value="emplacements">Emplacements</option>
                  <option value="entrepots">Entrepôts</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block mb-3 text-slate-300 font-medium">Sélectionnez un fichier</label>
                <div className="relative border-2 border-dashed border-slate-600 rounded-lg p-8 hover:border-cyan-400 transition-all">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  />
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-300 font-medium">
                      {fileName || 'Glissez-déposez ou cliquez'}
                    </p>
                    <p className="text-slate-500 text-sm">Excel (.xlsx), CSV (.csv)</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAnalyzeFile}
                disabled={!file || loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Analyse en cours...</>
                ) : (
                  <><ArrowRight className="w-5 h-5" /> Analyser et mapper les colonnes</>
                )}
              </button>
            </>
          )}

          {mappingStep === 'mapping' && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setMappingStep('upload')}
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>

                <h3 className="text-xl font-bold text-white mb-4">📋 Matrice de correspondance</h3>
                <p className="text-slate-400 mb-6">Associez chaque colonne de votre fichier aux champs du système</p>

                <div className="bg-slate-900 rounded-lg p-6 mb-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-4">Aperçu des données ({previewData.length} premières lignes)</h4>
                  
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm border border-slate-700">
                      <thead>
                        <tr className="bg-slate-800">
                          {detectedColumns.map((col, idx) => (
                            <th key={idx} className="text-left p-3 text-slate-300 border-b border-slate-700 font-semibold">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-slate-700">
                            {detectedColumns.map((col, colIdx) => (
                              <td key={colIdx} className="p-3 text-slate-400">{row[col] || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
