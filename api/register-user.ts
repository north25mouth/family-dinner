import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin初期化
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, displayName } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Firestoreにユーザー情報を保存
    await db.collection('lineUsers').doc(userId).set({
      userId,
      displayName: displayName || 'Unknown User',
      registeredAt: new Date(),
      isActive: true,
    });

    res.status(200).json({ 
      success: true, 
      message: 'User registered successfully',
      userId 
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 