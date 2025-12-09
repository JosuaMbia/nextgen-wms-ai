import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/receipts/ocr-init
 * Traiter un document uploadé (BL/facture) avec OCR et retourner les données extraites
 * 
 * Note: Pour une vraie implémentation production, utiliser un service OCR comme:
 * - Google Cloud Vision API
 * - AWS Textract
 * - Azure Computer Vision
 * - Tesseract.js (côté client ou serveur)
 * 
 * Cette implémentation retourne des données mockées pour développement
 */
export async function POST(request: NextRequest) {
  try {
    // Parser le FormData contenant l'image
        // Support both FormData (file upload) and JSON (for testing with mock data)
    const contentType = request.headers.get('content-type') || '';
    let file: File | null = null;

    if (contentType.includes('application/json')) {
      // JSON mode: frontend sends fileUrl for testing
      const body = await request.json();
      // In JSON mode, we skip actual file processing and go straight to mock data
      console.log('OCR-init called with JSON mode:', body);
    } else {
      // FormData mode: actual file upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
          }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (file) {
      if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Allowed types: JPEG, PNG, PDF',
          received: file.type
        },
        { status: 400 }
      );
    }

    // Validation de la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: 'File too large. Maximum size: 10MB',
          received: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }
              }

    // ============================================
    // TODO: Intégrer un vrai service OCR ici
    // ============================================
    // Exemple avec Google Cloud Vision:
    // const buffer = Buffer.from(await file.arrayBuffer());
    // const [result] = await visionClient.textDetection(buffer);
    // const detections = result.textAnnotations;
    // const extractedText = detections[0]?.description || '';
    
    // Pour le développement, on simule une extraction OCR
    if (file) {
      console.log('Processing file:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);
    } else {
          console.log('OCR init called with JSON mode (no file)');
    }
    
    // Simuler un délai de traitement OCR
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Données mockées extraites par OCR
    // Dans une vraie implémentation, ces données seraient extraites du document
    const ocrData = {
      success: true,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      processedAt: new Date().toISOString(),
      
      // Données extraites simulées
      extracted: {
        documentType: 'supplier_invoice', // ou 'delivery_note'
        documentNumber: `BL-${Math.floor(Math.random() * 10000)}`,
        documentDate: new Date().toISOString().split('T')[0],
        supplier: 'Fournisseur ABC',
        
        // Lignes de produits extraites
        lines: [
          {
            sku: `SKU-${Math.floor(Math.random() * 1000)}`,
            productName: 'Produit A extrait',
            quantity: Math.floor(Math.random() * 50) + 1,
            unitPrice: (Math.random() * 100 + 10).toFixed(2),
            lineTotal: 0, // Sera calculé
          },
          {
            sku: `SKU-${Math.floor(Math.random() * 1000)}`,
            productName: 'Produit B extrait',
            quantity: Math.floor(Math.random() * 30) + 1,
            unitPrice: (Math.random() * 80 + 5).toFixed(2),
            lineTotal: 0,
          },
          {
            sku: `SKU-${Math.floor(Math.random() * 1000)}`,
            productName: 'Produit C extrait',
            quantity: Math.floor(Math.random() * 20) + 1,
            unitPrice: (Math.random() * 60 + 15).toFixed(2),
            lineTotal: 0,
          },
        ],
        
        // Totaux extraits
        subtotal: 0,
        tax: 0,
        total: 0,
        currency: 'USD',
      },
      
      // Métadonnées du traitement OCR
      ocrMetadata: {
        confidence: 0.92, // Score de confiance de l'OCR (0-1)
        language: 'fr',
        processingTimeMs: 1500,
        engine: 'mock-ocr-v1', // Dans une vraie implémentation: 'google-vision', 'aws-textract', etc.
      },
      
      // Message pour l'utilisateur
      message: 'Document processed successfully with OCR. Please review and validate the extracted data.',
      warning: 'This is mock OCR data for development. Integrate a real OCR service for production.',
    };

    // Calculer les totaux des lignes
    ocrData.extracted.lines = ocrData.extracted.lines.map(line => ({
      ...line,
      lineTotal: (parseFloat(line.unitPrice) * line.quantity).toFixed(2),
    }));

    // Calculer les totaux globaux
    const subtotal = ocrData.extracted.lines.reduce(
      (sum, line) => sum + parseFloat(line.lineTotal),
      0
    );
    ocrData.extracted.subtotal = subtotal.toFixed(2);
    ocrData.extracted.tax = (subtotal * 0.2).toFixed(2); // TVA 20%
    ocrData.extracted.total = (subtotal * 1.2).toFixed(2);

    return NextResponse.json({
      poId: null,
      poNumber: ocrData.extracted.documentNumber,
      supplierName: ocrData.extracted.supplier,
      lines: ocrData.extracted.lines
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing OCR:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during OCR processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/receipts/ocr-init
 * Retourner les informations sur l'endpoint OCR
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/receipts/ocr-init',
    method: 'POST',
    description: 'Process supplier documents (invoices, delivery notes) with OCR',
    requiredFields: {
      file: 'File object (multipart/form-data)',
    },
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: '10MB',
    response: {
      success: 'boolean',
      extracted: 'object with document data',
      ocrMetadata: 'processing metadata',
    },
    note: 'Currently using mock OCR data for development. Integrate real OCR service for production.',
  });
}
