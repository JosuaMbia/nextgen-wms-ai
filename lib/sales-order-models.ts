// Sales Order Models for OCR → SO → Stock Check → Picking/PO workflow

export type SOStatus = 
  | 'DRAFT'           // Created from OCR, not yet validated
  | 'PENDING_VALIDATION' // Waiting for client confirmation  
  | 'VALIDATED'       // Client approved the order
  | 'STOCK_CHECK'     // Checking stock availability
  | 'READY_TO_PICK'   // Stock OK, ready for picking
  | 'AWAITING_STOCK'  // Stock insufficient, PO to supplier needed
  | 'PICKING'         // In picking process
  | 'SHIPPED'         // Order completed
  | 'CANCELLED';      // Order cancelled

export interface SalesOrderLine {
  lineId: string;
  sku: string;
  productName: string;
  quantityOrdered: number;
  quantityAvailable: number;  // From stock check
  quantityToPick: number;     // If stock OK
  quantityToPurchase: number; // If stock insufficient
  unitPrice: number;
  totalPrice: number;
  uom: string;
  // OCR confidence
  ocrConfidence?: number;
}

export interface SalesOrder {
  soId: string;
  soNumber: string;  // SO-2025-001
  
  // Source
  sourceType: 'OCR' | 'MANUAL';
  sourceOcrId?: string;  // Link to OCR receipt if from OCR
  quoteNumber?: string;  // From OCR: detected quote/devis number
  
  // Client info
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  
  // Order details
  lines: SalesOrderLine[];
  totalAmount: number;
  currency: string;
  
  // Status & workflow
  status: SOStatus;
  validatedAt?: number;  // When client validated
  validatedBy?: string;  // User who validated
  
  // Stock check results
  stockCheckCompletedAt?: number;
  stockCheckResult?: {
    allAvailable: boolean;
    partiallyAvailable: boolean;
    needsPurchase: boolean;
  };
  
  // Picking info (if stock OK)
  pickingOrderId?: string;
  
  // Purchase info (if stock insufficient)
  supplierPOIds?: string[];  // Generated POs to suppliers
  
  // Metadata
  warehouseId: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  notes?: string;
}

// Stock check result per line
export interface StockCheckResult {
  sku: string;
  requested: number;
  available: number;
  reserved: number;
  canFulfill: boolean;
  shortfall: number;  // requested - available
  batchIds?: string[]; // Available batches for picking
}

// Supplier PO intelligent generation params
export interface SupplierPOGenerationParams {
  requiredItems: Array<{
    sku: string;
    quantity: number;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  optimizationGoals: {
    minimizeCost: boolean;       // Minimize total order cost
    maximizeMargin: boolean;     // Maximize profit margin
    minimizeDeliveryTime: boolean; // Fastest delivery
    consolidateSuppliers: boolean; // Fewer POs
  };
  constraints: {
    maxBudget?: number;
    maxDeliveryDays?: number;
    preferredSuppliers?: string[];
  };
}

// Intelligent PO recommendation
export interface SupplierPORecommendation {
  recommendationId: string;
  totalCost: number;
  estimatedMargin: number;
  estimatedDeliveryDays: number;
  numberOfPOs: number;
  
  proposedPOs: Array<{
    supplierId: string;
    supplierName: string;
    items: Array<{
      sku: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      leadTimeDays: number;
    }>;
    poTotalCost: number;
    deliveryDate: number;
    score: number;  // Optimization score
  }>;
  
  rationale: string;  // Why this recommendation
  createdAt: number;
}
