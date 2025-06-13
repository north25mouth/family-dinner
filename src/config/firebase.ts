import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase設定
// 本番環境では環境変数から取得
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD3JmulWBuBbwth_Ml5CKLSjmDZLVDMcA8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "familydinner-ae09b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "familydinner-ae09b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "familydinner-ae09b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "888619716500",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:888619716500:web:4c0ceee0cc0f759206c981"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firestore初期化
export const db = getFirestore(app);

// Authentication初期化
export const auth = getAuth(app);

// Functions初期化
export const functions = getFunctions(app);

// 開発環境でエミュレーターを使用
if (import.meta.env.DEV) {
  // Firestoreエミュレーター
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      console.log('Firestore emulator already connected');
    }
  }
  
  // Authenticationエミュレーター
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
    } catch (error) {
      console.log('Auth emulator already connected');
    }
  }
  
  // Functionsエミュレーター
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (error) {
      console.log('Functions emulator already connected');
    }
  }
}

export default app; 