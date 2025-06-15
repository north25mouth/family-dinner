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

interface CustomNotificationSchedule {
  id: string;
  memberId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  time: string; // HH:MM format
  message: string;
  enabled: boolean;
  createdAt: Date;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { schedules }: { schedules: CustomNotificationSchedule[] } = req.body;

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ error: 'Invalid schedules data' });
    }

    // Firestoreにスケジュールを保存
    const batch = db.batch();
    
    schedules.forEach((schedule) => {
      const scheduleRef = db.collection('lineNotificationSchedules').doc(schedule.id);
      batch.set(scheduleRef, {
        ...schedule,
        updatedAt: new Date(),
      });
    });

    await batch.commit();

    // 実際の運用では、ここでcron jobやスケジューラーサービスに
    // スケジュール情報を送信する処理を追加

    res.status(200).json({ 
      success: true, 
      message: `${schedules.length} schedules updated successfully`,
      schedules: schedules.map(s => ({
        id: s.id,
        memberId: s.memberId,
        dayOfWeek: s.dayOfWeek,
        time: s.time,
        enabled: s.enabled
      }))
    });
  } catch (error) {
    console.error('Update schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 