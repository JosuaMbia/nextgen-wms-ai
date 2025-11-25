# 📦 NextGen WMS AI

> **Warehouse Management System piloté par l'IA** - Analyse prédictive, optimisation intelligente, et gestion des risques géopolitiques

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## 🎯 Vue d'ensemble

**NextGen WMS AI** est un système de gestion d'entrepôt nouvelle génération qui combine l'intelligence artificielle avec la logistique moderne. Conçu pour les entreprises qui cherchent à optimiser leurs opérations et anticiper les ruptures de stock.

### ✨ Fonctionnalités Principales

#### 🧠 Intelligence Artificielle
- **Prédiction de rupture de stock** : Algorithme de burn rate avec projection temporelle
- **Analyse géopolitique** : Intégration des risques pays (grèves, douanes, conflits)
- **Optimisation du rangement** : Scoring multi-critères (rotation ABC, ergonomie, proximité)
- **Arbitrage fournisseurs** : Calcul coût/délai/risque en temps réel

#### 📊 Dashboard Temps Réel
- **KPIs dynamiques** : Valeur stock, taux de service, risque supply
- **AI Supply Guardian** : Assistant IA proactif avec alertes et recommandations
- **Digital Twin 3D** : Visualisation de l'entrepôt avec occupation par zone
- **Graphiques prédictifs** : Projection des stocks avec seuils dynamiques

#### 🔄 Intégrations
- 🛍️ **Shopify** : Synchronisation automatique des commandes
- 📧 **Office 365** : Emails, calendrier, notifications Teams
- 🚚 **Transporteurs** : Tracking DHL, UPS, Colissimo
- 🌐 **API Géopolitique** : Score de risque pays en temps réel

---

## 🛠️ Stack Technique

```yaml
Frontend:
  - Framework: Next.js 14 (App Router)
  - Language: TypeScript 5.3
  - Styling: Tailwind CSS
  - State: React Query (TanStack)
  - Charts: Recharts
  - Icons: Lucide React

Backend:
  - API: Next.js API Routes (Serverless)
  - Functions: Firebase Cloud Functions
  
Base de données:
  - Firestore: Données structurées
  - Realtime DB: Données temps réel
  - Storage: Documents & images

Déploiement:
  - Hosting: Vercel
  - CI/CD: GitHub Actions
  - Monitoring: Vercel Analytics + Firebase
```

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Compte Firebase
- Compte Vercel (pour déploiement)

### Installation

```bash
# Cloner le repository
git clone https://github.com/JosuaMbia/nextgen-wms-ai.git
cd nextgen-wms-ai

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.local.example .env.local

# Éditer .env.local avec vos credentials Firebase
```

### Configuration Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activer **Firestore** et **Realtime Database**
3. Récupérer vos credentials
4. Ajouter dans `.env.local` :

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Lancer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📚 Documentation

Pour une documentation technique complète, consultez :

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** : Architecture technique, modèle de données, algorithmes IA
- **[API Documentation](./docs/api.md)** : Documentation des API Routes
- **[Deployment Guide](./docs/deployment.md)** : Guide de déploiement Vercel

---

## 📋 Modèle de Données

### Collections Firestore

```typescript
├── products/           # Produits (SKU, rotation, stock)
├── suppliers/          # Fournisseurs (lead time, risque)
├── warehouses/         # Entrepôts (zones 3D)
├── inventory_movements/ # Mouvements (traçabilité)
├── orders/             # Commandes (Shopify sync)
├── geopolitical_risks/ # Risques pays
└── demand_forecasts/   # Prévisions IA
```

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les schémas détaillés.

---

## 🤖 Algorithmes IA

### 1. Calcul de Besoin et Risque

Intègre :
- **Burn rate** : Consommation moyenne calculée sur 30 jours
- **Lead time ajusté** : Majoration selon risque géopolitique
- **Stock de sécurité dynamique** : Calculé en temps réel
- **Arbitrage coût/délai** : Recommandations multiples fournisseurs

### 2. Optimisation du Put-Away

Scoring multi-critères :
- **Rotation ABC** : Produits A → picking, B/C → stockage
- **Ergonomie** : Produits lourds en bas, légers en haut
- **Proximité** : Minimisation des déplacements
- **Occupation** : Optimisation 70-80%

---

## 📡 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Variables d'environnement

Configurer sur Vercel Dashboard :
- Firebase credentials
- API keys (Shopify, Office 365)
- Webhooks secrets

---

## 🛣️ Roadmap

- [x] Architecture & modèle de données
- [x] Algorithmes IA (pseudo-code)
- [x] Documentation technique
- [ ] Implémentation composants React
- [ ] Intégration Firebase
- [ ] API Routes (products, orders, AI)
- [ ] Webhooks Shopify
- [ ] Tests unitaires
- [ ] Déploiement production
- [ ] Mobile app (React Native)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Distribué sous licence MIT. Voir `LICENSE` pour plus d'informations.

---

## 💬 Contact

**Josua Mbia** - CEO & CTO

- GitHub: [@JosuaMbia](https://github.com/JosuaMbia)
- Email: josuambia75@gmail.com

**Project Link**: [https://github.com/JosuaMbia/nextgen-wms-ai](https://github.com/JosuaMbia/nextgen-wms-ai)

---

## 🚀 Développement par

- **DevOps & Cloud**: AWS, Vercel, Firebase
- **Automation**: AI agents, n8n, Power Automate
- **ERP Integration**: Odoo, Shopify, Office 365

---

<p align="center">
  <strong>Fait avec ❤️ pour optimiser la supply chain</strong>
</p>
