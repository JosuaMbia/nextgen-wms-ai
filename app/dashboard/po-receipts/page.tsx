'use client';

import { useEffect, useState } from 'react';

interface PurchaseOrderLine {
  lineId: string;
  sku: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  uom: string;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  companyId: string;
  warehouseId: string;
  poNumber: string;
  supplierName: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'closed';
  orderDate: string;
  expectedDate: string | null;
  currency: string;
  totalAmount?: number;
  lines: PurchaseOrderLine[];
}

interface OcrReceiptLineSuggestion {
  poLineId: string | null;
  sku: string | null;
  productName: string | null;
  expectedQty: number | null;
  proposedQty: number;
  uom: string | null;
  matchConfidence: number;
}

interface OcrReceiptSuggestion {
  poId: string | null;
  poNumber: string | null;
  supplierName: string | null;
  lines: OcrReceiptLineSuggestion[];
}

interface ReceiptLineInput extends OcrReceiptLineSuggestion {
  lineId: string;
  receivedQty: number;
}

export default function PoReceiptsPage() {
  const [companyId] = useState('demo-company');
  const [warehouseId] = useState('demo-warehouse');

  const [poNumber, setPoNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [poLinesForm, setPoLinesForm] = useState<
    { sku: string; productName: string; orderedQty: number; unitPrice: number; uom: string }[]
  >([{ sku: '', productName: '', orderedQty: 0, unitPrice: 0, uom: 'PCS' }]);

  const [creatingPo, setCreatingPo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrSuggestion, setOcrSuggestion] = useState<OcrReceiptSuggestion | null>(null);
  const [receiptLines, setReceiptLines] = useState<ReceiptLineInput[]>([]);
  const [poForReceipt, setPoForReceipt] = useState<PurchaseOrder | null>(null);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  // 1. Création d’un PO fournisseur
  const addPoLineRow = () => {
    setPoLinesForm((prev) => [
      ...prev,
      { sku: '', productName: '', orderedQty: 0, unitPrice: 0, uom: 'PCS' },
    ]);
  };

  const updatePoLineRow = (index: number, field: string, value: string) => {
    setPoLinesForm((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              [field]:
                field === 'orderedQty' || field === 'unitPrice'
                  ? Number(value)
                  : value,
            }
          : line
      )
    );
  };

  const createPurchaseOrder = async () => {
    if (!poNumber || !supplierName) return;
    if (poLinesForm.length === 0) return;

    setCreatingPo(true);
    try {
      const body = {
        companyId,
        warehouseId,
        poNumber,
        supplierName,
        orderDate: new Date().toISOString(),
        expectedDate: null,
        currency,
        lines: poLinesForm,
      };

      const res = await fetch('/api/v1/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error('Error creating PO', await res.text());
        return;
      }

      const data = await res.json();
      setPoForReceipt({
        id: data.id,
        companyId: data.companyId,
        warehouseId: data.warehouseId,
        poNumber: data.poNumber,
        supplierName: data.supplierName,
        status: data.status,
        orderDate: data.orderDate,
        expectedDate: data.expectedDate,
        currency: data.currency,
        totalAmount: data.totalAmount,
        lines: data.lines,
      });
    } finally {
      setCreatingPo(false);
    }
  };

  // 2. Mock upload fichier + appel OCR-init
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setSelectedFile(e.target.files[0]);
  };

  const callOcrInit = async () => {
    if (!selectedFile) return;

    // Dans une version réelle : upload vers Storage ou autre, récupérer fileUrl.
    const fakeFileUrl = `https://example.com/${selectedFile.name}`;

    const body = {
      companyId,
      warehouseId,
      fileUrl: fakeFileUrl,
    };

    const res = await fetch('/api/v1/receipts/ocr-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('Error in OCR init', await res.text());
      return;
    }

    const suggestion: OcrReceiptSuggestion = await res.json();
    setOcrSuggestion(suggestion);

    const linesWithInput: ReceiptLineInput[] = suggestion.lines.map((l, idx) => ({
      ...l,
      lineId: `line-${idx}-${Date.now()}`,
      receivedQty: l.proposedQty ?? 0,
    }));

    setReceiptLines(linesWithInput);
  };

  const updateReceiptLine = (index: number, field: keyof ReceiptLineInput, value: string) => {
    setReceiptLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              [field]: field === 'receivedQty' ? Number(value) : value,
            }
          : line
      )
    );
  };

  // 3. POST /api/v1/receipts final
  const submitReceipt = async () => {
    if (!ocrSuggestion) return;
    if (!receiptLines.length) return;

    const poId = ocrSuggestion.poId ?? poForReceipt?.id;
    if (!poId) {
      console.error('No PO associated to receipt');
      return;
    }

    setSubmittingReceipt(true);
    try {
      const body = {
        companyId,
        warehouseId,
        poId,
        reference: `BL-${Date.now()}`,
        receiptDate: new Date().toISOString(),
        createdBy: 'system',
        lines: receiptLines.map((l) => ({
          lineId: l.lineId,
          poLineId: l.poLineId,
          sku: l.sku || '',
          productName: l.productName || '',
          expectedQty: l.expectedQty,
          receivedQty: l.receivedQty,
          uom: l.uom || 'PCS',
        })),
      };

      const res = await fetch('/api/v1/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error('Error creating receipt', await res.text());
        return;
    }
      setOcrSuggestion(null);
      setReceiptLines([]);
      setSelectedFile(null);
          } finally {
            }
      setSubmittingReceipt(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-slate-800">
        Réceptions PO (avec OCR)
      </h1>

      {/* Bloc création PO */}
      <section className="bg-white shadow rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Créer un PO fournisseur</h2>
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
            <span className="text-sm font-medium text-slate-700">
              Lignes de PO
            </span>
            <button
              type="button"
              onClick={addPoLineRow}
              className="text-sm text-indigo-600 hover:underline">
            >
              Ajouter une ligne
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
                        onChange={(e) =>
                          updatePoLineRow(idx, 'sku', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={line.productName}
                        onChange={(e) =>
                          updatePoLineRow(idx, 'productName', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1 text-xs text-right"
                        value={line.orderedQty}
                        onChange={(e) =>
                          updatePoLineRow(idx, 'orderedQty', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1 text-xs text-right"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updatePoLineRow(idx, 'unitPrice', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={line.uom}
                        onChange={(e) =>
                          updatePoLineRow(idx, 'uom', e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

      {/* Bloc OCR + tableau de réception */}
      <section className="bg-white shadow rounded-lg p-4 space-y-4 mt-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Scanner un BL / facture fournisseur (OCR)
        </h2>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <input type="file" onChange={handleFileChange} />
          <button
            type="button"
            onClick={callOcrInit}
            className="inline-flex items-center px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            disabled={!selectedFile}
          >
            Lancer l&apos;OCR
          </button>
        </div>

        {ocrSuggestion && (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">
              PO détecté :{' '}
              <span className="font-semibold">
                {ocrSuggestion.poNumber || 'non trouvé'}
              </span>{' '}
              · Fournisseur :{' '}
              <span className="font-semibold">
                {ocrSuggestion.supplierName || supplierName || '-'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Article PO</th>
                    <th className="px-3 py-2 text-right">Qty attendue</th>
                    <th className="px-3 py-2 text-right">Qty OCR</th>
                    <th className="px-3 py-2 text-right">Qty réceptionnée</th>
                    <th className="px-3 py-2 text-right">Confiance</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptLines.map((line, idx) => (
                    <tr key={line.lineId} className="border-b">
                      <td className="px-3 py-2">
                        {line.sku || '-'}
                      </td>
                      <td className="px-3 py-2">
                        {line.productName || '-'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {line.expectedQty ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {line.proposedQty}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          className="w-24 border rounded px-2 py-1 text-xs text-right"
                          value={line.receivedQty}
                          onChange={(e) =>
                            updateReceiptLine(idx, 'receivedQty', e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {(line.matchConfidence * 100).toFixed(0)}%
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
                disabled={submittingReceipt || !receiptLines.length}
              >
                Valider la réception
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

