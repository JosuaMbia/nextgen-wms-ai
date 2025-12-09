# Guide de Déploiement des Règles Firestore

## Contexte
Les règles de sécurité Firestore contrôlent l'accès client aux collections de la base de données. Ce dépôt contient maintenant :
- `firestore.rules` : Définition des règles de sécurité
- `firebase.json` : Configuration Firebase pointant vers les règles

## Déploiement via Firebase Console (Méthode Manuelle)

### Étape 1 : Accéder à la Console Firebase
1. Ouvrir https://console.firebase.google.com/
2. Sélectionner le projet **NextGen WMS AI**
3. Dans le menu latéral, cliquer sur **Firestore Database**
4. Cliquer sur l'onglet **Règles** (Rules)

### Étape 2 : Copier les Règles
1. Ouvrir le fichier `firestore.rules` de ce dépôt
2. Copier l'intégralité du contenu
3. Coller dans l'éditeur de la console Firebase
4. Cliquer sur **Publier** (Publish)

### Étape 3 : Vérifier le Déploiement
Après publication, vous devriez voir :
- Message de confirmation "Règles publiées avec succès"
- Date/heure de la dernière publication

## Déploiement via Firebase CLI (Recommandé)

### Prérequis
```bash
npm install -g firebase-tools
firebase login
```

### Commandes de Déploiement
```bash
# Déployer uniquement les règles Firestore
firebase deploy --only firestore:rules

# Vérifier les règles avant déploiement
firebase deploy --only firestore:rules --dry-run
```

## Règles Actuelles

Les règles configurées autorisent :
- **Lecture (read)** : Tous les utilisateurs authentifiés ou non peuvent lire les collections suivantes :
  - `sales-orders`
  - `purchase-orders`
  - `receipts`
  - `warehouses`
  - `products`
  - `orders`
- **Écriture (write)** : Bloquée côté client (seul le backend Admin SDK peut écrire)

## Test des Règles

Après déploiement :

1. **Vérifier sur l'application** :
   - Naviguer vers https://nextgen-wms-ai.vercel.app/dashboard/sales-orders
   - L'erreur "Erreur lors du chargement des commandes" devrait disparaître
   - Les commandes devraient s'afficher si elles existent dans Firestore

2. **Vérifier dans la console du navigateur** :
   - Ouvrir DevTools (F12)
   - Console devrait afficher : `✅ Sales Orders loaded successfully: X orders`
   - Pas d'erreur `permission-denied`

3. **Simulateur de règles Firebase** :
   - Dans Firebase Console → Firestore → Règles
   - Cliquer sur "Simulateur de règles"
   - Tester une requête `get` sur `/sales-orders/{id}`
   - Le résultat devrait être "Autorisé"

## Dépannage

### Erreur : "Missing or insufficient permissions"
**Cause** : Les règles n'ont pas été déployées ou sont trop restrictives  
**Solution** : Vérifier que les règles sont bien publiées dans la console Firebase

### Erreur : "PERMISSION_DENIED"
**Cause** : Les règles bloquent l'accès  
**Solution** : Vérifier que la collection demandée a bien `allow read: if true;`

### Les règles sont déployées mais l'erreur persiste
**Solutions** :
1. Attendre 1-2 minutes (propagation des règles)
2. Vider le cache du navigateur et recharger
3. Vérifier que la collection existe dans Firestore
4. Vérifier les logs de la console navigateur pour le message d'erreur exact

## Prochaines Étapes

Après avoir déployé ces règles :
1. Tester le flow complet OCR → Réception → Sales Order
2. Vérifier que les données s'affichent correctement sur `/dashboard/sales-orders`
3. Si succès : documenter le flow fonctionnel
4. Si échec : analyser les logs de la console navigateur pour identifier le problème

## Sécurité

⚠️ **Note Importante** : Les règles actuelles autorisent la lecture publique (`allow read: if true;`). Pour la production :
- Remplacer par `allow read: if request.auth != null;` (authentification requise)
- Ajouter des règles plus granulaires basées sur les rôles utilisateur
