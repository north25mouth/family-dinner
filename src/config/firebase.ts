import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase設定
// 本番環境では環境変数から取得
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
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