      // Reset
      if (receiptMode === 'manual') {
        setManualReceiptLines([]);
        setSelectedPoId('');
      } else {
        setOcrSuggestion(null);
        setOcrReceiptLines([]);
        setSelectedFile(null);
      }

      alert('✅ Réception validée avec succès !');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-slate-800">
        Réceptions Entrepôt
      </h1>

      {/* Sélecteur de mode */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Mode de réception</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setReceiptMode('manual')}
            className={`px-4 py-2 rounded font-medium ${
              receiptMode === 'manual'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            📋 Réception Manuelle
          </button>
          <button
            onClick={() => setReceiptMode('ocr')}
            className={`px-4 py-2 rounded font-medium ${
              receiptMode === 'ocr'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            🔍 Réception OCR / Scan
          </button>
        </div>
      </div>

      {/* Bloc création PO (commun aux 2 modes) */}
      <section className="bg-white shadow rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">
          1. Créer un PO fournisseur (optionnel)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Numéro PO</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="PO-2025-0001"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Fournisseur</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Fournisseur ABC"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Devise</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Lignes de PO</span>
            <button
              type="button"
              onClick={addPoLineRow}
              className="text-sm text-indigo-600 hover:underline"
            >
              + Ajouter une ligne
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Produit</th>
                  <th className="px-3 py-2 text-right">Qté</th>
                  <th className="px-3 py-2 text-right">PU</th>
                  <th className="px-3 py-2 text-left">UoM</th>
                </tr>
              </thead>
              <tbody>
                {poLinesForm.map((line, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={line.sku}
                        onChange={(e) => updatePoLineRow(idx, 'sku', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={line.productName}
                        onChange={(e) => updatePoLineRow(idx, 'productName', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1 text-xs text-right"
                        value={line.orderedQty}
                        onChange={(e) => updatePoLineRow(idx, 'orderedQty', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1 text-xs text-right"
                        value={line.unitPrice}
                        onChange={(e) => updatePoLineRow(idx, 'unitPrice', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={line.uom}
                        onChange={(e) => updatePoLineRow(idx, 'uom', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={createPurchaseOrder}
            disabled={creatingPo || !poNumber || !supplierName}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingPo ? 'Création en cours...' : 'Créer le PO'}
          </button>
        </div>
      </section>

      {/* ======================= MODE MANUEL ======================= */}
      {receiptMode === 'manual' && (
        <section className="bg-white shadow rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            2. Réception Manuelle
          </h2>

          {manualReceiptLines.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-slate-700">
                PO sélectionné : <span className="font-semibold">{poForReceipt?.poNumber || selectedPoId}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">Produit</th>
                      <th className="px-3 py-2 text-right">Attendu</th>
                      <th className="px-3 py-2 text-right">Reçu</th>
                      <th className="px-3 py-2 text-left">Emplacement</th>
                      <th className="px-3 py-2 text-left">Lot / Série</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualReceiptLines.map((line, idx) => (
                      <tr key={line.lineId} className="border-b">
                        <td className="px-3 py-2">{line.sku}</td>
                        <td className="px-3 py-2">{line.productName}</td>
                        <td className="px-3 py-2 text-right">{line.expectedQty ?? '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            className="w-24 border rounded px-2 py-1 text-xs text-right"
                            value={line.receivedQty}
                            onChange={(e) =>
                              updateManualReceiptLine(idx, 'receivedQty', e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="w-32 border rounded px-2 py-1 text-xs"
                            value={line.binLocation}
                            onChange={(e) =>
                              updateManualReceiptLine(idx, 'binLocation', e.target.value)
                            }
                            placeholder="A-01-02"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="w-32 border rounded px-2 py-1 text-xs"
                            value={line.lotNumber || ''}
                            onChange={(e) =>
                              updateManualReceiptLine(idx, 'lotNumber', e.target.value)
                            }
                            placeholder="LOT-12345"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={submitReceipt}
                  className="inline-flex items-center px-4 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                  disabled={submittingReceipt || !manualReceiptLines.length}
                >
                  {submittingReceipt ? 'Validation...' : '✅ Valider la réception'}
                </button>
              </div>
            </div>
          )}

          {manualReceiptLines.length === 0 && (
            <p className="text-sm text-slate-500">
              Créez d'abord un PO ci-dessus pour pré-remplir les lignes de réception.
            </p>
          )}
        </section>
      )}

      {/* ======================= MODE OCR ======================= */}
      {receiptMode === 'ocr' && (
        <section className="bg-white shadow rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            2. Scanner un BL / facture fournisseur (OCR)
          </h2>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <input type="file" onChange={handleFileChange} />
            <button
              type="button"
              onClick={callOcrInit}
              className="inline-flex items-center px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              🔍 Lancer l'OCR
            </button>
          </div>

          {ocrSuggestion && (
            <div className="space-y-3">
              <div className="text-sm text-slate-700">
                PO détecté : <span className="font-semibold">{ocrSuggestion.poNumber || 'non trouvé'}</span> ·
                Fournisseur : <span className="font-semibold">{ocrSuggestion.supplierName || supplierName || '-'}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">Article</th>
                      <th className="px-3 py-2 text-right">Attendu</th>
                      <th className="px-3 py-2 text-right">OCR</th>
                      <th className="px-3 py-2 text-right">Reçu</th>
                      <th className="px-3 py-2 text-left">Emplacement</th>
                      <th className="px-3 py-2 text-right">Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocrReceiptLines.map((line, idx) => (
                      <tr key={line.lineId} className="border-b">
                        <td className="px-3 py-2">{line.sku || '-'}</td>
                        <td className="px-3 py-2">{line.productName || '-'}</td>
                        <td className="px-3 py-2 text-right">{line.expectedQty ?? '—'}</td>
                        <td className="px-3 py-2 text-right">{line.proposedQty}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            className="w-24 border rounded px-2 py-1 text-xs text-right"
                            value={line.receivedQty}
                            onChange={(e) =>
                              updateOcrReceiptLine(idx, 'receivedQty', e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="w-32 border rounded px-2 py-1 text-xs"
                            value={line.binLocation}
                            onChange={(e) =>
                              updateOcrReceiptLine(idx, 'binLocation', e.target.value)
                            }
                            placeholder="A-01-02"
                          />
