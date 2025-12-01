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
  const [importType, setImportType] = useState<string>('articles');

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
      formData.append('type', importType);

      const response = await fetch('/api/v1/data/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          success: true,
          message: `✅ Import réussi : ${data.validRows} lignes validées`,
          details: data.invalidRows.length > 0 ? `${data.invalidRows.length} erreurs trouvées` : 'Aucune erreur',
        });
      } else {
        setStatus({
          success: false,
          message: `❌ ${data.error || 'Erreur de connexion'}`,
          details: data.details || 'Erreur inconnue',
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

      {/* Tabs */}
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

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
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
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
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
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-white">{status.message}</p>
                {status.details && <p className="text-slate-300 text-sm mt-1">{status.details}</p>}
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
            <p className="text-slate-400">Téléchargez vos données au format CSV</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => handleExport('products')}
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 border border-slate-600 rounded-lg p-6 text-left transition-all"
            >
              <Download className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Produits</h3>
              <p className="text-slate-400 text-sm">Exporter la liste des produits</p>
            </button>

            <button
              onClick={() => handleExport('warehouses')}
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 border border-slate-600 rounded-lg p-6 text-left transition-all"
            >
              <Download className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Entrepôts</h3>
              <p className="text-slate-400 text-sm">Exporter la liste des entrepôts</p>
            </button>

            <button
              onClick={() => handleExport('orders')}
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 border border-slate-600 rounded-lg p-6 text-left transition-all"
            >
              <Download className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Commandes</h3>
              <p className="text-slate-400 text-sm">Exporter l'historique des commandes</p>
            </button>
          </div>

          {status && (
            <div className={`mt-6 p-4 rounded-lg flex gap-3 items-start ${
              status.success
                ? 'bg-green-900 bg-opacity-30 border border-green-700'
                : 'bg-red-900 bg-opacity-30 border border-red-700'
            }`}>
              {status.success ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-white">{status.message}</p>
                {status.details && <p className="text-slate-300 text-sm mt-1">{status.details}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
