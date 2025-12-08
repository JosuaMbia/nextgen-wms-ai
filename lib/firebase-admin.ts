/**
 * Firebase Admin SDK pour les routes API côté serveur
 * Utilise le service account JSON complet encodé en base64
 */

import * as admin from 'firebase-admin';

// Initialisation du SDK Admin (singleton pattern)
if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!serviceAccountBase64) {
    console.error('❌ Variable d\'environnement FIREBASE_SERVICE_ACCOUNT_BASE64 manquante');
    throw new Error('Firebase Admin: FIREBASE_SERVICE_ACCOUNT_BASE64 manquante');
  }

  try {
    // Décoder le JSON du service account depuis base64
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin:', error);
    throw error;
  }
}

// Export de l'instance Firestore Admin

// Helper function to initialize admin (for backwards compatibility)
export function initAdmin() {
  return admin;
}
export const adminDb = admin.firestore();

// Export de l'instance Admin pour autres services (Auth, Storage, etc.)
export const adminAuth = admin.auth();

export default admin;


// Trigger redeploy
