import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@line/bot-sdk';
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

// LINE Bot設定
const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // セキュリティ：認証トークンをチェック
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  if (authToken !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    
    // 曜日に応じたメッセージを作成
    let message = '';
    
    if (dayOfWeek === 1) { // 月曜日
      message = `🍽️ 今週の夜ご飯予定を入力しましょう！\n\n📅 家族の夜ご飯スケジュール：\nhttps://family-dinner.vercel.app\n\n✨ 新しい週が始まりました！\n今週の夜ご飯予定を家族みんなで共有して、\n楽しい食事時間を過ごしましょう🎉`;
    } else if (dayOfWeek === 3) { // 水曜日
      message = `🍽️ 今週後半の夜ご飯予定はいかがですか？\n\n📅 予定の確認・更新：\nhttps://family-dinner.vercel.app\n\n💡 週の真ん中です！\n木曜日〜日曜日の予定も\n忘れずに入力してくださいね😊`;
    } else if (dayOfWeek === 5) { // 金曜日
      message = `🍽️ 週末の夜ご飯予定をチェック！\n\n📅 家族の夜ご飯スケジュール：\nhttps://family-dinner.vercel.app\n\n🎉 お疲れさまでした！\n週末の夜ご飯予定も確認して、\n素敵な週末をお過ごしください✨`;
    } else {
      // その他の曜日は送信しない
      return res.status(200).json({ 
        success: true, 
        message: `Today is ${dayNames[dayOfWeek]}. No reminder scheduled.` 
      });
    }

    // Firestoreからアクティブなユーザーを取得
    const usersSnapshot = await db.collection('lineUsers')
      .where('isActive', '==', true)
      .get();

    const userIds = usersSnapshot.docs.map(doc => doc.data().userId);

    if (userIds.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active users found',
        day: dayNames[dayOfWeek]
      });
    }

    // 登録されたユーザーにメッセージを送信
    const promises = userIds.map(userId => 
      client.pushMessage(userId, {
        type: 'text',
        text: message
      })
    );

    await Promise.all(promises);

    res.status(200).json({ 
      success: true, 
      message: `Reminder sent to ${userIds.length} users`,
      day: dayNames[dayOfWeek]
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 