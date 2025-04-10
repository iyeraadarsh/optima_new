
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
export const initAdmin = () => {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  }
  return admin;
};

export const adminAuth = () => {
  const app = initAdmin();
  return app.auth();
};

export const adminFirestore = () => {
  const app = initAdmin();
  return app.firestore();
};

export const adminStorage = () => {
  const app = initAdmin();
  return app.storage();
};

export { admin };
