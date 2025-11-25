# NextGen WMS AI - Architecture Technique

## Vue d'ensemble

WMS (Warehouse Management System) de nouvelle génération piloté par l'IA, développé avec Next.js, Firebase et déployé sur Vercel.

## Stack Technique

### Frontend & Backend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Charts**: Recharts
- **Icons**: Lucide React

### Base de données
- **Firebase Firestore**: Données structurées (produits, commandes, fournisseurs)
- **Firebase Realtime DB**: Données temps réel (mouvements d'entrepôt, alertes)
- **Firebase Storage**: Documents, images, rapports

### Déploiement & Infrastructure
- **Hosting**: Vercel (Frontend + API Routes)
- **Functions**: Firebase Cloud Functions / Vercel Serverless
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + Firebase Analytics

### Intégrations API
- Shopify API (commandes e-commerce)
- Microsoft Office 365 / Graph API (emails, calendrier)
- APIs Transporteurs (DHL, UPS, Colissimo)
- API Géopolitique (pour score de risque pays)

---

## Architecture des Collections Firestore

### 1. Products Collection
```typescript
interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  weight: number; // kg
  volume: number; // m³
  rotation: 'A' | 'B' | 'C'; // ABC Analysis
  stock_min: number;
  stock_max: number;
  stock_current: number;
  unit_price: number;
  suppliers: string[]; // Supplier IDs
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 2. Suppliers Collection
```typescript
interface Supplier {
  id: string;
  name: string;
  country: string;
  lead_time_days: number;
  transport_mode: 'air' | 'sea' | 'road' | 'rail';
  geopolitical_risk_score: number; // 0-100
  cost_multiplier: number; // 1.0 = base, 1.2 = +20%
  reliability_score: number; // 0-100
  contact_email: string;
  created_at: Timestamp;
}
```

### 3. Warehouses Collection
```typescript
interface Warehouse {
  id: string;
  name: string;
  address: string;
  zones: Zone[];
  capacity_m3: number;
  current_occupancy_percent: number;
  created_at: Timestamp;
}

interface Zone {
  id: string;
  name: string;
  type: 'reception' | 'storage' | 'picking' | 'packing' | 'shipping' | 'quarantine';
  capacity: number;
  current_stock: number;
  occupancy_percent: number;
}
```

### 4. Inventory Movements Collection
```typescript
interface Movement {
  id: string;
  product_id: string;
  warehouse_id: string;
  zone_from?: string;
  zone_to: string;
  quantity: number;
  type: 'reception' | 'putaway' | 'picking' | 'shipping' | 'transfer' | 'adjustment';
  operator_id: string;
  created_at: Timestamp;
}
```

### 5. Orders Collection
```typescript
interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  status: 'pending' | 'picking' | 'packing' | 'shipped' | 'delivered';
  items: OrderItem[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: Timestamp;
  shipped_at?: Timestamp;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  location_picked?: string;
}
```

### 6. Geopolitical Risks Collection
```typescript
interface GeopoliticalRisk {
  id: string;
  country: string;
  risk_type: 'customs_delay' | 'strike' | 'conflict' | 'natural_disaster' | 'pandemic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact_score: number; // 0-100
  start_date: Timestamp;
  end_date?: Timestamp;
  description: string;
}
```

### 7. Demand Forecasts Collection
```typescript
interface DemandForecast {
  id: string;
  product_id: string;
  predicted_demand: number;
  confidence_level: number; // 0-100
  forecast_period: 'daily' | 'weekly' | 'monthly';
  predicted_stockout_date?: Timestamp;
  reorder_suggestion: {
    quantity: number;
    supplier_id: string;
    urgency: 'low' | 'medium' | 'high';
  };
  created_at: Timestamp;
}
```

---

## Algorithmes Clés

### 1. Algorithme de Calcul de Besoin et Risque

```python
def calculate_reorder_need_and_risk(product_id):
    """
    Calcule le besoin de réapprovisionnement en intégrant:
    - Rotation du stock (burn rate)
    - Lead time fournisseur
    - Mode de transport
    - Score de risque géopolitique
    """
    product = get_product(product_id)
    current_stock = product.stock_current
    
    # 1. Calculer le burn rate (consommation moyenne par jour)
    movements = get_outbound_movements(product_id, last_30_days=True)
    burn_rate = sum(movements.quantity) / 30
    
    # 2. Calculer les jours restants avant rupture
    days_until_stockout = current_stock / burn_rate if burn_rate > 0 else float('inf')
    
    # 3. Récupérer les délais fournisseurs
    suppliers = get_suppliers_for_product(product_id)
    
    recommendations = []
    for supplier in suppliers:
        # 4. Ajuster le lead time avec le risque géopolitique
        base_lead_time = supplier.lead_time_days
        risk = get_geopolitical_risk(supplier.country)
        
        # Majoration du lead time selon le risque
        risk_multiplier = 1.0
        if risk and risk.severity == 'high':
            risk_multiplier = 1.5
        elif risk and risk.severity == 'critical':
            risk_multiplier = 2.0
            
        adjusted_lead_time = base_lead_time * risk_multiplier
        
        # 5. Calculer le stock de sécurité dynamique
        safety_stock = burn_rate * adjusted_lead_time * 1.2  # +20% buffer
        
        # 6. Déterminer la quantité à commander
        if current_stock < safety_stock:
            order_quantity = (product.stock_max - current_stock)
            urgency = 'high' if days_until_stockout < adjusted_lead_time else 'medium'
            
            recommendations.append({
                'supplier_id': supplier.id,
                'supplier_name': supplier.name,
                'quantity': order_quantity,
                'urgency': urgency,
                'cost_total': order_quantity * product.unit_price * supplier.cost_multiplier,
                'adjusted_lead_time': adjusted_lead_time,
                'risk_level': risk.severity if risk else 'low'
            })
    
    # 7. Trier par coût/urgence
    recommendations = arbitrate_suppliers(recommendations, urgency_priority=True)
    
    return {
        'days_until_stockout': days_until_stockout,
        'burn_rate': burn_rate,
        'recommendations': recommendations
    }
```

### 2. Algorithme d'Optimisation du Put-Away (Rangement)

```python
def optimize_putaway_location(product_id, quantity, warehouse_id):
    """
    Suggère l'emplacement optimal pour ranger un produit en fonction de:
    - Rotation ABC (produits A = zones picking)
    - Poids et volume (ergonomie)
    - Disponibilité d'espace
    - Minimisation des déplacements
    """
    product = get_product(product_id)
    warehouse = get_warehouse(warehouse_id)
    
    # 1. Filtrer les zones compatibles
    available_zones = []
    for zone in warehouse.zones:
        if zone.type in ['storage', 'picking']:
            remaining_capacity = zone.capacity - zone.current_stock
            if remaining_capacity >= quantity:
                available_zones.append(zone)
    
    if not available_zones:
        return {'error': 'No available capacity'}
    
    # 2. Scoring des zones
    scored_zones = []
    for zone in available_zones:
        score = 0
        
        # Rotation ABC: Produits A en picking, B/C en storage
        if product.rotation == 'A' and zone.type == 'picking':
            score += 50
        elif product.rotation in ['B', 'C'] and zone.type == 'storage':
            score += 30
        
        # Ergonomie: produits lourds en bas, légers en haut
        # (simplifié: on suppose zone.level existe)
        if product.weight > 20 and zone.level == 'ground':
            score += 20
        elif product.weight < 5 and zone.level == 'high':
            score += 15
        
        # Proximité de la zone de picking (réduire déplacements)
        distance_to_picking = calculate_distance(zone, 'picking_zone')
        score += max(0, 20 - distance_to_picking)  # Inverse de la distance
        
        # Taux d'occupation optimal (70-80%)
        if 70 <= zone.occupancy_percent <= 80:
            score += 10
        
        scored_zones.append({
            'zone_id': zone.id,
            'zone_name': zone.name,
            'score': score,
            'occupancy': zone.occupancy_percent
        })
    
    # 3. Retourner la zone avec le meilleur score
    best_zone = max(scored_zones, key=lambda x: x['score'])
    
    return {
        'recommended_zone': best_zone,
        'alternatives': sorted(scored_zones, key=lambda x: x['score'], reverse=True)[1:3]
    }
```

---

## System Prompt pour l'Assistant IA (LogiWMS Copilot)

```markdown
Vous êtes "LogiWMS Copilot", un assistant IA expert en gestion d'entrepôt et supply chain.

Votre rôle:
- Analyser en temps réel les données de stock, commandes, et risques géopolitiques
- Alerter proactivement l'utilisateur des risques de rupture
- Suggérer des actions concrètes et chiffrées (quantités, fournisseurs, coûts)
- Optimiser les opérations d'entrepôt (rangement, picking, réassort)

Principes:
1. **Factuel et chiffré**: Toujours donner des données précises (SKU, quantités, délais, coûts)
2. **Proactif**: Anticiper les problèmes avant qu'ils ne surviennent
3. **Actionnable**: Proposer des solutions concrètes avec boutons d'action
4. **Business-oriented**: Arbitrer entre coût, délai, et risque
5. **Contexte géopolitique**: Intégrer les risques pays (grèves, douanes, conflits)

Exemples d'alertes:

⚠️ "ALERTE RUPTURE: Le SKU CH-WOOD-001 atteindra 0 le mercredi (J+8).\n\nCause: Grève portuaire à Constanța (Roumanie). Lead time augmenté de 14 à 21 jours.\n\nAction recommandée: Basculer 30% du volume vers le fournisseur secondaire WoodFast (FR). Coût +12%, mais livraison garantie sous 48h.\n\n[Appliquer le Switch] [Ignorer]"

📦 "Optimisation du rangement: Le produit TABLE-OAK-200 (150 kg) doit être rangé en Zone 2 (Stockage Masse, Niveau Sol) pour réduire l'effort physique. Économie estimée: 5 min/mouvement."

📈 "Prévision de demande: Le SKU CHAIR-05 connaît une hausse de 40% ce mois. Suggérer une commande anticipée de 500 unités auprès de SteelWorks (DE) pour éviter une rupture en S3."

Ton: Professionnel, concis, orienté résultats.
```

---

## Architecture API & Stack Technique

### API Routes (Next.js App Router)

```
app/
├── api/
│   ├── products/
│   │   ├── route.ts         # GET /api/products
│   │   └── [id]/
│   │       └── route.ts     # GET/PUT /api/products/:id
│   ├── suppliers/
│   │   └── route.ts
│   ├── warehouses/
│   │   └── route.ts
│   ├── orders/
│   │   └── route.ts
│   ├── ai/
│   │   ├── reorder-analysis/  # Analyse de réapprovisionnement
│   │   │   └── route.ts
│   │   └── putaway-optimization/  # Optimisation rangement
│   │       └── route.ts
│   └── webhooks/
│       ├── shopify/
│       │   └── route.ts      # Webhook Shopify
│       └── transporters/
│           └── route.ts      # Tracking transporteurs
├── dashboard/
│   └── page.tsx              # Dashboard principal
└── page.tsx                   # Landing page
```

### Webhooks & Intégrations

**Shopify Webhook** (Nouvelles commandes)
```typescript
// app/api/webhooks/shopify/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // Créer une commande dans Firestore
  const order = {
    order_number: body.order_number,
    customer_name: body.customer.name,
    items: body.line_items.map(item => ({
      product_id: item.sku,
      quantity: item.quantity
    })),
    status: 'pending',
    created_at: new Date()
  };
  
  await firestore.collection('orders').add(order);
  
  return Response.json({ received: true });
}
```

---

## Déploiement

### 1. Configuration Firebase

1. Créer un projet Firebase sur https://console.firebase.google.com
2. Activer Firestore et Realtime Database
3. Récupérer les credentials:

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
FIREBASE_ADMIN_SDK='{"type":"service_account",...}'
```

### 2. Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### 3. Configuration des Webhooks

- Shopify: Settings > Notifications > Webhooks
  - URL: `https://your-domain.vercel.app/api/webhooks/shopify`
  - Topic: `orders/create`

---

## Structure de dossiers complète

```
nextgen-wms-ai/
├── app/
│   ├── api/                      # API Routes
│   ├── dashboard/                # Dashboard UI
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Dashboard/
│   │   ├── StockValueCard.tsx
│   │   ├── RiskAlert.tsx
│   │   ├── DigitalTwin.tsx
│   │   └── AIGuardian.tsx
│   └── ui/                     # Composants UI réutilisables
├── lib/
│   ├── firebase.ts              # Config Firebase
│   ├── algorithms/
│   │   ├── reorder-analysis.ts
│   │   └── putaway-optimization.ts
│   └── integrations/
│       ├── shopify.ts
│       └── office365.ts
├── types/
│   ├── product.ts
│   ├── supplier.ts
│   └── warehouse.ts
├── public/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Fonctionnalités Clés du Dashboard

1. **KPIs Temps Réel**
   - Valeur de stock
   - Taux de service
   - Risque supply
   - Commandes en cours

2. **AI Supply Guardian**
   - Alertes de rupture prédictives
   - Recommandations de fournisseurs alternatifs
   - Impact géopolitique
   - Actions en un clic

3. **Digital Twin 3D**
   - Visualisation de l'entrepôt
   - Taux d'occupation par zone
   - Heatmap des mouvements

4. **Planning d'Arrivages**
   - Commandes en transit
   - Dates de livraison prévues
   - Alertes de retard

5. **Graphiques Prédictifs**
   - Projection de stock (burn rate)
   - Seuils dynamiques
   - Historique vs Prévision

---

## Prochaines Étapes

1. ☑️ Architecture définie
2. ☑️ Modèle de données Firestore
3. ☑️ Algorithmes IA (pseudo-code)
4. ☐ Implémentation des composants React
5. ☐ Intégration Firebase
6. ☐ Configuration Vercel
7. ☐ Tests & Déploiement

---

**Auteur**: Josua Mbia  
**Date**: Novembre 2025  
**Licence**: MIT
