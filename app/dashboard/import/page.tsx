'use client';

import { useState } from 'react';
import { Upload, Download, Check, AlertCircle, Loader } from 'lucide-react';

interface ImportStatus {
  success: boolean;
  message: string;
  details?: string;
}

type TabType = 'import' | 'export';

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('import');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setStatus(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setStatus({ success: false, message: 'Veuillez sélectionner un fichier' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/data/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setStatus({
          success: true,
          message: `✅ ${data.message || 'Importation réussie!'}`,
          details: `${data.totalRowsImported || 0} articles importés avec succès`,
        });
        setFile(null);
        setFileName('');
      } else {
        setStatus({
          success: false,
          message: `❌ ${data.error || 'Erreur lors de l\'importation'}`,
          details: data.details,
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
          message: `❌ Erreur lors de l'export de ${dataType}`,
        });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: '❌ Erreur lors du téléchargement',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Import/Export de Données</h1>
          <p className="text-slate-400">Gérez vos données de manière simple et efficace</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => { setActiveTab('import'); setStatus(null); }}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'import'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Importer des Données
          </button>
          <button
            onClick={() => { setActiveTab('export'); setStatus(null); }}
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

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <div className="text-center mb-8">
              <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Importer les Données</h2>
              <p className="text-slate-400">Importez votre fichier Excel ou CSV</p>
            </div>

            <div className="mb-6">
              <label className="block mb-3 text-slate-300 font-medium">Sélectionnez un fichier</label>
              <div className="relative border-2 border-dashed border-slate-600 rounded-lg p-8 hover:border-cyan-400 transition-colors cursor-pointer bg-slate-700 bg-opacity-50">
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
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mb-6"
            >
              {loading ? (
                <><Loader className="w-5 h-5 animate-spin" /> Importation en cours...</>
              ) : (
                <><Upload className="w-5 h-5" /> Importer</>
              )}
            </button>

            {status && (
              <div className={`p-4 rounded-lg flex gap-3 items-start ${
                status.success
                  ? 'bg-green-900 bg-opacity-30 border border-green-700'
                  : 'bg-red-900 bg-opacity-30 border border-red-700'
              }`}>
                {status.success ? (
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={status.success ? 'text-green-300' : 'text-red-300'}>
                    {status.message}
                  </p>
                  {status.details && (
                    <p className="text-sm text-slate-400 mt-1">{status.details}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <div className="text-center mb-8">
              <Download className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Exporter les Données</h2>
              <p className="text-slate-400">Téléchargez vos données en format CSV</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { type: 'warehouses', label: 'Entrepôts', icon: '📦' },
                { type: 'products', label: 'Produits', icon: '📊' },
                { type: 'orders', label: 'Commandes', icon: '🛒' },
                { type: 'analytics', label: 'Analytique', icon: '📈' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleExport(item.type)}
                  disabled={loading}
                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 border border-slate-600 hover:border-cyan-400 rounded-lg p-4 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <h3 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-slate-400 text-sm">Exporter en CSV</p>
                    </div>
                    <Download className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            {status && (
              <div className={`p-4 rounded-lg flex gap-3 items-start ${
                status.success
                  ? 'bg-green-900 bg-opacity-30 border border-green-700'
                  : 'bg-red-900 bg-opacity-30 border border-red-700'
              }`}>
                {status.success ? (
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={status.success ? 'text-green-300' : 'text-red-300'}>
                    {status.message}
                  </p>
                  {status.details && (
                    <p className="text-sm text-slate-400 mt-1">{status.details}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
