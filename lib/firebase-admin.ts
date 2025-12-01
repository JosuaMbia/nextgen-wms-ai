/**
 * Firebase Admin SDK pour les routes API côté serveur
 */

import * as admin from 'firebase-admin';

// Initialisation du SDK Admin (singleton pattern)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Variables d\'environnement Firebase manquantes:');
    console.error('FIREBASE_PROJECT_ID:', !!projectId);
    console.error('FIREBASE_CLIENT_EMAIL:', !!clientEmail);
    console.error('FIREBASE_PRIVATE_KEY:', !!privateKey);
    throw new Error('Firebase Admin: variables d\'environnement manquantes');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // La clé privée doit être au format avec \\n échappés
        privateKey: privateKey.replace(/\\n/g, '\n'),
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
