'use client';

import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Loader } from 'lucide-react';

interface ImportResult {
  success: boolean;
  validRows: number;
  totalRows: number;
  invalidRows: Array<{ row: number; errors: string[] }>;
  aiAnalysis?: {
    recommendations: string[];
    riskAlerts: string[];
    optimizations: string[];
  };
}

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabType[] = [
  { id: 'articles', label: 'Articles', icon: <FileText className="w-4 h-4" /> },
  { id: 'emplacements', label: 'Emplacements', icon: <FileText className="w-4 h-4" /> },
  { id: 'settings', label: 'Paramétrages', icon: <FileText className="w-4 h-4" /> },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('articles');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', activeTab);

      const response = await fetch('/api/v1/data/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setImportResult(data);
    } catch (error) {
      setImportResult({
        success: false,
        validRows: 0,
        totalRows: 0,
        invalidRows: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`/api/v1/data/import?template=${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${type}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement template:', error);
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-white">Gestion des Données</h1>
        <p className="text-gray-400 mt-2">Import/Export en masse avec validation IA et optimisation logistique</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-4 border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setImportResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Zone d'upload */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Importer des données
              </h2>
              
              {/* Zone de drag-drop */}
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-400 transition">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
                      <p className="text-gray-400">Validation en cours...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-white font-medium">Cliquez ou glissez votre fichier</p>
                      <p className="text-sm text-gray-500">CSV ou Excel (< 10 MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Template */}
              <button
                onClick={() => downloadTemplate(activeTab)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger le template
              </button>
            </div>
          </div>

          {/* Guide d'import */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Format attendu</h3>
            <div className="space-y-3 text-sm text-gray-300">
              {activeTab === 'articles' && (
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>SKU</strong>: Identifiant unique</li>
                  <li><strong>Nom</strong>: Désignation article</li>
                  <li><strong>Catégorie</strong>: Clasification</li>
                  <li><strong>Prix</strong>: Prix unitaire</li>
                  <li><strong>Date Péremption</strong>: YYYY-MM-DD (optionnel)</li>
                  <li><strong>Date Stockage</strong>: Entrée en stock (YYYY-MM-DD)</li>
                  <li><strong>Quantité</strong>: Nombre d'unités</li>
                </ul>
              )}
              {activeTab === 'emplacements' && (
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Code</strong>: ID unique de l'emplacement</li>
                  <li><strong>Zone</strong>: Zone de l'entrepôt</li>
                  <li><strong>Niveau</strong>: sol | hauteur | picking</li>
                  <li><strong>Capacité</strong>: Capacité max (kg ou unités)</li>
                  <li><strong>Temp/Humidite</strong>: Conditions climatiques (optionnel)</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="space-y-6">
          {importResult && (
            <div className={`rounded-lg p-6 border ${
              importResult.success
                ? 'bg-emerald-900/20 border-emerald-700'
                : 'bg-red-900/20 border-red-700'
            }`}>
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">
                    {importResult.success ? 'Import réussi!' : 'Erreur lors de l\'import'}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <strong>Total:</strong> {importResult.totalRows} lignes
                    </p>
                    <p className="text-emerald-300">
                      <strong>Validées:</strong> {importResult.validRows} lignes
                    </p>
                    {importResult.invalidRows.length > 0 && (
                      <div className="mt-3 p-3 bg-slate-900 rounded">
                        <p className="text-red-300 font-medium mb-2">
                          Erreurs ({importResult.invalidRows.length}):
                        </p>
                        <ul className="space-y-1 text-xs text-gray-300">
                          {importResult.invalidRows.slice(0, 5).map((row, idx) => (
                            <li key={idx}>Ligne {row.row}: {row.errors.join(', ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Insights IA */}
                    {importResult.aiAnalysis && (
                      <div className="mt-4 p-3 bg-cyan-900/20 rounded border border-cyan-700">
                        <p className="text-cyan-300 font-medium mb-2">🤖 Insights IA:</p>
                        <ul className="space-y-1 text-xs text-cyan-200">
                          {importResult.aiAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-cyan-400" />
              Exporter les données
            </h2>
            <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg transition font-medium">
              Télécharger {activeTab} (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
