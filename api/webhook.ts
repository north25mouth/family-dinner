import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client, middleware, MiddlewareConfig, WebhookEvent, TextMessage } from '@line/bot-sdk';
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
const config: MiddlewareConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client(config);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // LINE署名検証
    const signature = req.headers['x-line-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    const body = JSON.stringify(req.body);
    
    // Webhookイベント処理
    const events: WebhookEvent[] = req.body.events;
    
    await Promise.all(events.map(async (event) => {
      // フォローイベント（友達追加）の処理
      if (event.type === 'follow') {
        const userId = event.source.userId;
        if (userId) {
          // ユーザー情報を取得してFirestoreに保存
          try {
            const profile = await client.getProfile(userId);
            await db.collection('lineUsers').doc(userId).set({
              userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              registeredAt: new Date(),
              isActive: true,
            });
          } catch (error) {
            console.error('Failed to save user profile:', error);
          }
        }

        const welcomeMessage: TextMessage = {
          type: 'text',
          text: `🎉 家族夕飯カレンダーBotへようこそ！\n\n🍽️ このBotでは定期的に夕飯予定の入力をお知らせします。\n\n📅 家族夕飯カレンダー：\nhttps://family-dinner.vercel.app\n\n💡 「夕飯」「予定」「使い方」「ヘルプ」などのキーワードで話しかけてください！\n\n✨ 毎週月・水・金曜日に予定入力のリマインダーをお送りします。`
        };
        
        await client.replyMessage(event.replyToken, welcomeMessage);
      }
      
      // メッセージイベントの処理
      if (event.type === 'message' && event.message.type === 'text') {
        const { replyToken } = event;
        const { text } = event.message;
        
        let replyMessage: TextMessage;
        
        if (text.toLowerCase().includes('夕飯') || text.toLowerCase().includes('予定')) {
          replyMessage = {
            type: 'text',
            text: `🍽️ 家族夕飯カレンダーで予定を確認・登録してください！\n\n📅 こちらからアクセス：\nhttps://family-dinner.vercel.app\n\n✅ 今週の夕飯予定を入力して、家族みんなで共有しましょう！`
          };
        } else if (text.toLowerCase().includes('使い方') || text.toLowerCase().includes('ヘルプ')) {
          replyMessage = {
            type: 'text',
            text: `📖 使い方ガイド：\nhttps://family-dinner.vercel.app/usage.html\n\n🔧 基本的な使い方：\n1. アプリにアクセス\n2. ユーザー名でログイン\n3. 夕飯の出席予定を入力\n4. 家族メンバーを追加して共有\n\n何かご質問があれば「ヘルプ」と送信してください！`
          };
        } else {
          replyMessage = {
            type: 'text',
            text: `こんにちは！🍽️\n\n家族夕飯カレンダーBotです。\n\n📅 夕飯の予定を確認・登録：\nhttps://family-dinner.vercel.app\n\n💡 「夕飯」「予定」「使い方」「ヘルプ」などのキーワードで話しかけてください！`
          };
        }
        
        await client.replyMessage(replyToken, replyMessage);
      }
    }));
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 