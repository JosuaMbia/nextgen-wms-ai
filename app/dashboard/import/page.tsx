'use client';

import { useState } from 'react';
import { Upload, Check, AlertCircle, Loader } from 'lucide-react';

interface ImportStatus {
  success: boolean;
  message: string;
  details?: string;
}

export default function ImportPage() {
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
          details: `${data.totalRowsImported || 0} articles importés avec succès`
        });
        setFile(null);
        setFileName('');
      } else {
        setStatus({
          success: false,
          message: `❌ ${data.error || 'Erreur lors de l\'importation'}`,
          details: data.details
        });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: '❌ Erreur de connexion',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Importer les Données</h1>
          <p className="text-slate-400">Importez votre fichier Excel ou CSV</p>
        </div>

        {/* File Upload Area */}
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

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader className="w-5 h-5 animate-spin" /> Importation en cours...</>
            ) : (
              <><Upload className="w-5 h-5" /> Importer</>  
            )}
          </button>
        </div>

        {/* Status Message */}
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
              <p className={status.success ? 'text-green-300' : 'text-red-300'} >
                {status.message}
              </p>
              {status.details && (
                <p className="text-sm text-slate-400 mt-1">{status.details}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
