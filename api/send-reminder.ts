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
      message = `🍽️ 今週の夕飯予定を入力しましょう！\n\n📅 家族夕飯カレンダー：\nhttps://family-dinner.vercel.app\n\n✨ 新しい週が始まりました！\n今週の夕飯予定を家族みんなで共有して、\n楽しい食事時間を過ごしましょう🎉`;
    } else if (dayOfWeek === 3) { // 水曜日
      message = `🍽️ 今週後半の夕飯予定はいかがですか？\n\n📅 予定の確認・更新：\nhttps://family-dinner.vercel.app\n\n💡 週の真ん中です！\n木曜日〜日曜日の予定も\n忘れずに入力してくださいね😊`;
    } else if (dayOfWeek === 5) { // 金曜日
      message = `🍽️ 週末の夕飯予定をチェック！\n\n📅 家族夕飯カレンダー：\nhttps://family-dinner.vercel.app\n\n🎉 お疲れさまでした！\n週末の夕飯予定も確認して、\n素敵な週末をお過ごしください✨`;
    } else {
      // その他の曜日は送信しない
      return res.status(200).json({ 
        success: true, 
        message: `Today is ${dayNames[dayOfWeek]}. No reminder scheduled.` 
      });
    }

    // 基本的なリマインダーメッセージを送信
    const usersSnapshot = await db.collection('lineUsers')
      .where('isActive', '==', true)
      .get();

    const userIds = usersSnapshot.docs.map(doc => doc.data().userId);
    let sentCount = 0;

    if (userIds.length > 0) {
      // 基本リマインダーを送信
      const basicPromises = userIds.map(userId => 
        client.pushMessage(userId, {
          type: 'text',
          text: message
        })
      );
      await Promise.all(basicPromises);
      sentCount += userIds.length;
    }

    // 個別スケジュールをチェック
    const schedulesSnapshot = await db.collection('lineNotificationSchedules')
      .where('enabled', '==', true)
      .where('dayOfWeek', '==', dayOfWeek)
      .get();

    const customSchedules = schedulesSnapshot.docs.map(doc => doc.data());
    
    // 現在時刻と一致するスケジュールを実行
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    const matchingSchedules = customSchedules.filter(schedule => 
      schedule.time === currentTime
    );

    if (matchingSchedules.length > 0) {
      // メンバーIDからLINEユーザーIDを取得する処理
      // 実際の実装では、メンバーIDとLINEユーザーIDの関連付けが必要
      const customPromises = matchingSchedules.map(async (schedule) => {
        // ここでは簡単のため、全てのアクティブユーザーに送信
        // 実際の運用では、メンバーIDに対応するLINEユーザーIDを特定する
        const customMessage = schedule.message || message;
        
        return Promise.all(userIds.map(userId => 
          client.pushMessage(userId, {
            type: 'text',
            text: `📅 個別リマインダー\n\n${customMessage}\n\n家族夕飯カレンダー：\nhttps://family-dinner.vercel.app`
          })
        ));
      });

      await Promise.all(customPromises);
      sentCount += matchingSchedules.length * userIds.length;
    }

    res.status(200).json({ 
      success: true, 
      message: `Reminder sent to ${userIds.length} users, ${matchingSchedules.length} custom schedules executed`,
      day: dayNames[dayOfWeek],
      customSchedulesExecuted: matchingSchedules.length
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 