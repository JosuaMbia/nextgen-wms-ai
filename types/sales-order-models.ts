/**
 * Sales Order TypeScript Models
 * For NextGen WMS AI - Sales Order Management
 */

// Sales Order Status Enum
export type SalesOrderStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'in_picking'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'on_hold';

// Sales Order Line Interface
export interface SalesOrderLine {
  lineId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  uom: string; // Unit of Measure (e.g., 'pcs', 'kg', 'box')
  taxRate?: number;
  discount?: number;
  notes?: string;
  ocrConfidence?: number; // If generated from OCR
}

// Sales Order Interface
export interface SalesOrder {
  soId: string; // Sales Order ID
  soNumber: string; // Human-readable SO number (e.g., 'SO-2025-0001')
  
  // Client Information
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  
  // Quote/OCR Reference
  quoteNumber?: string; // Original quote number
  ocrId?: string; // Reference to OCR receipt if generated from OCR
  
  // Order Details
  lines: SalesOrderLine[];
  status: SalesOrderStatus;
  
  // Pricing
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  shippingCost: number;
  totalAmount: number;
  currency: string; // e.g., 'EUR', 'USD'
  
  // Warehouse & Fulfillment
  warehouseId: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requestedDeliveryDate?: Date | string;
  actualDeliveryDate?: Date | string;
  
  // Tracking
  trackingNumber?: string;
  shippingCarrier?: string;
  
  // Metadata
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  
  // Timestamps
  createdAt: Date | string;
  createdBy: string; // User ID
  updatedAt?: Date | string;
  updatedBy?: string;
  confirmedAt?: Date | string;
  shippedAt?: Date | string;
}

// Request body for generating SO from OCR
export interface GenerateSalesOrderFromOCRRequest {
  ocrId: string;
  quoteNumber?: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  lines: Array<{
    lineId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    uom: string;
    ocrConfidence?: number;
  }>;
  warehouseId: string;
  currency?: string;
  notes?: string;
}

// Response body for SO generation
export interface GenerateSalesOrderResponse {
  success: boolean;
  salesOrder?: SalesOrder;
  message?: string;
  error?: string;
}
