/**
 * Firebase Admin SDK pour les routes API côté serveur
 * 
 * ARCHITECTURE MULTI-TENANT:
 * Ce fichier configure Firebase Admin pour VOTRE instance master.
 * Chaque client aura son propre projet Firebase séparé avec ses propres credentials.
 * 
 * CONFIGURATION REQUISE:
 * Ajoutez ces variables d'environnement dans Vercel:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL  
 * - FIREBASE_PRIVATE_KEY (au format: "-----BEGIN PRIVATE KEY-----\n...")
 */

import * as admin from 'firebase-admin';

// Initialisation du SDK Admin (singleton pattern)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // La clé privée doit être au format avec \n échappés
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin:', error);
    throw error;
  }
}

// Export de l'instance Firestore Admin
export const adminDb = admin.firestore();

// Export de l'instance Admin pour autres services (Auth, Storage, etc.)
export const adminAuth = admin.auth();
export default admin;

/**
 * UTILISATION DANS VOS API ROUTES:
 * 
 * import { adminDb } from '@/lib/firebase-admin';
 * 
 * // Écriture de données (bypass des règles Firestore)
 * await adminDb.collection('articles').doc(id).set(data);
 * 
 * // Lecture de données
 * const snapshot = await adminDb.collection('articles').get();
 * 
 * IMPORTANT POUR LE MULTI-TENANT:
 * - Chaque client aura son propre Firebase project
 * - Utilisez une collection "tenants" pour stocker les configs des clients
 * - Chaque tenant aura ses propres credentials Firebase Admin
 * - Votre instance master servira au monitoring et billing
 */
