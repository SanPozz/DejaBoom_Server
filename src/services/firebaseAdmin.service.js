import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import serviceAccountInfo from '../../dejaboom-auth-firebase-adminsdk-fbsvc-dc2a5c75dd.json' with { type: 'json' };

const app = getApps()[0] ?? initializeApp({
  credential: cert(serviceAccountInfo),
});

export const firebaseAuth = getAuth(app);