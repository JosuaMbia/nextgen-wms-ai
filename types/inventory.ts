import { Timestamp } from 'firebase/firestore';

/**
 * Types pour le système de réception et gestion des lots
 */

export type TemperatureZone = 'ambient' | 'chilled' | 'frozen' | 'other';

export type ReceiptStatus = 'draft' | 'received' | 'closed';

/**
 * Ligne de réception
 */
export interface ReceiptLine {
  productId: string;           // ID du produit dans la collection products
  sku: string;                 // SKU du produit (copie pour requêtes rapides)
  name: string;                // Nom du produit (copie)
  orderedQty?: number;         // Quantité commandée (optionnel)
  receivedQty: number;         // Quantité effectivement reçue
  lotNumber: string;           // Numéro de lot
  expiryDate: Timestamp | null; // Date de péremption (null si non périssable)
  temperatureZone: TemperatureZone; // Zone de stockage température
}

/**
 * Document de réception (collection receipts)
 */
export interface Receipt {
  id: string;                  // Document ID Firestore
  reference: string;           // Référence BL / commande fournisseur (ex: "BL-2025-0001")
  supplier?: string;           // Nom du fournisseur (optionnel)
  date: Timestamp;             // Date de réception
  status: ReceiptStatus;       // Statut de la réception
  warehouseId?: string;        // ID entrepôt (optionnel, pour multi-entrepôts)
  lines: ReceiptLine[];        // Lignes de la réception
  createdAt?: Timestamp;       // Date de création du document
  updatedAt?: Timestamp;       // Date de dernière mise à jour
}

/**
 * Document de lot de stock (collection stockLots)
 */
export interface StockLot {
  id: string;                  // Document ID Firestore
  productId: string;           // Référence au produit
  sku: string;                 // SKU (copie)
  name: string;                // Nom du produit (copie)
  lotNumber: string;           // Numéro de lot
  expiryDate: Timestamp | null; // Date de péremption
  temperatureZone: TemperatureZone; // Zone de température
  quantity: number;            // Quantité actuellement disponible dans ce lot
  warehouseId?: string;        // ID entrepôt (optionnel)
  createdAt: Timestamp;        // Date de création
  updatedAt: Timestamp;        // Date de dernière mise à jour
}

/**
 * Formulaire pour créer/éditer une réception (côté client)
 */
export interface ReceiptFormData {
  reference: string;
  supplier?: string;
  date: Date;
  lines: {
    productId: string;
    sku: string;
    name: string;
    orderedQty?: number;
    receivedQty: number;
    lotNumber: string;
    expiryDate: Date | null;
    temperatureZone: TemperatureZone;
  }[];
}
