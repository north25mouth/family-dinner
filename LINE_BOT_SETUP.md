# LINE Bot設定ガイド

## 1. LINE Developers Console設定

### 1.1 LINE Developersアカウント作成
1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. LINEアカウントでログイン
3. 新しいプロバイダーを作成

### 1.2 Messaging APIチャネル作成
1. 「新しいチャネルを作成」をクリック
2. 「Messaging API」を選択
3. 以下の情報を入力：
   - チャネル名: `家族の夜ご飯スケジュールBot`
   - チャネル説明: `家族の夕飯予定を管理するLINE Bot`
   - 大業種: `個人`
   - 小業種: `個人（その他）`

### 1.3 チャネル設定
1. 作成したチャネルの「Messaging API設定」タブを開く
2. 以下の設定を行う：
   - **Webhook URL**: `https://family-dinner.vercel.app/api/webhook`
   - **Webhookの利用**: `オン`
   - **応答メッセージ**: `オフ`
   - **あいさつメッセージ**: `オン`

### 1.4 必要な情報を取得
以下の情報をメモしてください：
- **チャネルアクセストークン** (長期)
- **チャネルシークレット**

## 2. Firebase Admin設定

### 2.1 サービスアカウントキー作成
1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト設定 → サービスアカウント
3. 「新しい秘密鍵の生成」をクリック
4. JSONファイルをダウンロード

### 2.2 必要な情報を取得
JSONファイルから以下の情報を取得：
- `project_id`
- `client_email`
- `private_key`

## 3. Vercel環境変数設定

Vercelダッシュボードで以下の環境変数を設定：

```
# LINE Bot設定
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# Firebase Admin設定
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
CRON_SECRET=your_random_secret_key

# 既存のFirebase設定
VITE_FIREBASE_API_KEY=AIzaSyD3JmulWBuBbwth_Ml5CKLSjmDZLVDMcA8
VITE_FIREBASE_AUTH_DOMAIN=familydinner-ae09b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=familydinner-ae09b
VITE_FIREBASE_STORAGE_BUCKET=familydinner-ae09b.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=888619716500
VITE_FIREBASE_APP_ID=1:888619716500:web:4c0ceee0cc0f759206c981
```

## 4. LINE Bot機能

### 4.1 自動応答機能
- 「夕飯」「予定」→ カレンダーへのリンクを送信
- 「使い方」「ヘルプ」→ 使い方ガイドを送信
- その他のメッセージ → 基本的な案内を送信

### 4.2 定期メッセージ送信
- **月曜日 9:00**: 今週の夕飯予定入力を促すメッセージ
- **水曜日 9:00**: 週後半の予定確認メッセージ
- **金曜日 9:00**: 週末の予定確認メッセージ

### 4.3 ユーザー管理
- 友達追加時に自動でFirestoreに登録
- ユーザー情報（ID、表示名、プロフィール画像）を保存
- アクティブユーザーのみにメッセージ送信

### 4.4 通知設定について
通知の詳細設定（時間変更、個別スケジュール等）は、LINE Bot側で直接管理することを推奨します。
- LINE公式アカウントの管理画面で配信時間を調整
- リッチメニューやクイックリプライで設定オプションを提供
- ユーザーごとの設定はLINE Bot内で管理

## 5. QRコード・友達追加URL

LINE Developers Consoleの「Messaging API設定」から以下を取得：
- **QRコード**: 印刷して配布可能
- **友達追加URL**: WebサイトやSNSで共有可能

## 6. テスト方法

### 6.1 Webhook テスト
```bash
curl -X POST https://family-dinner.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
```

### 6.2 リマインダー送信テスト
```bash
curl -X POST https://family-dinner.vercel.app/api/send-reminder \
  -H "Authorization: Bearer your_cron_secret"
```

## 7. 運用開始

1. 環境変数を全て設定
2. Vercelにデプロイ
3. LINE Bot設定を完了
4. 家族メンバーに友達追加URLを共有
5. 定期メッセージの動作確認

## トラブルシューティング

### よくある問題
- **Webhook応答なし**: 環境変数の設定を確認
- **メッセージ送信失敗**: チャネルアクセストークンを確認
- **定期メッセージが送信されない**: Vercel Cronの設定とCRON_SECRETを確認

### ログ確認
Vercelダッシュボードの「Functions」タブでログを確認できます。 