# 🍽️ 家族夕飯カレンダー

家族全員の夕飯出席状況をリアルタイムで管理・共有するWebアプリケーションです。

![](https://img.shields.io/badge/React-18.2.0-blue)
![](https://img.shields.io/badge/TypeScript-5.2.2-blue)
![](https://img.shields.io/badge/Tailwind_CSS-3.3.6-blue)
![](https://img.shields.io/badge/PWA-対応-green)

## ✨ 主な機能

### 🔥 Firebase連携によるリアルタイム同期
- **複数デバイス間での即座な同期**
- **家族全員が同じデータを共有**
- **オフライン対応とデータ永続化**

### 📱 認証システム
- **ゲストログイン** - アカウント不要で即座に利用開始
- **メール認証** - 複数デバイスでの本格的な同期
- **匿名認証** - プライバシー重視の方向け

### 📅 週間カレンダー表示
- 月曜日から日曜日までの1週間を一覧表示
- 今日の日付をハイライト表示
- 前週・翌週への簡単移動

### 👥 出席状況管理
- **🍽️ 出席**: 夕飯を一緒に食べます
- **❌ 欠席**: 夕飯は食べません
- **❓ 未定**: まだ決まっていません
- ワンタップで状態切り替え

### 📊 今日のサマリー
- 今日の夕飯に参加する人数を表示
- 出席メンバーの一覧表示
- 準備が必要な人数分を明確に表示

### 📱 マルチデバイス対応
- スマートフォン、タブレット、PCで最適表示
- タッチ操作に配慮した44px以上のボタンサイズ
- レスポンシブデザイン

### 💾 データの永続化
- ローカルストレージを使用してデータを保存
- ブラウザを閉じてもデータが保持される

### 📝 メモ・コメント機能
- 日別メモの管理
- メンバー固有のコメント
- リアルタイムでのメモ共有

### 🔔 通知システム
- ブラウザ通知によるリマインダー
- カスタマイズ可能な通知時刻
- 参加締切の自動通知

## 🚀 セットアップ手順

### 1. プロジェクトのクローン
```bash
git clone <repository-url>
cd family-dinner
npm install
```

### 2. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. 以下のサービスを有効化：

#### Authentication設定
- Authentication > Sign-in method で以下を有効化：
  - **Anonymous（匿名認証）** - ゲストユーザー用
  - **Email/Password** - 本格利用ユーザー用

#### Firestore Database設定
- Firestore Database を作成
- 開始時は「テストモード」を選択
- 本番運用時はセキュリティルールを適切に設定

#### Firebase設定の取得
- Project Settings > General > Your apps
- "SDK setup and configuration" から以下の値を取得：
  - API Key
  - Auth Domain
  - Project ID
  - Storage Bucket
  - Messaging Sender ID
  - App ID

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

## 📱 使用方法

### 初回利用
1. **「今すぐ始める（ゲスト）」** をクリックしてゲストログイン
2. 自動的にデフォルトメンバーが作成されます
3. メンバー管理から実際の家族構成に変更

### 日常利用
1. 週間カレンダーでタップして出席状況を変更
2. メモボタンで日々のコメントを追加
3. 通知設定でリマインダーをカスタマイズ

### 複数デバイスでの同期
1. **メール認証でアカウント作成**
2. 同じアカウントで他のデバイスからログイン
3. **リアルタイムで全デバイスが同期**

## 🔧 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **バックエンド**: Firebase
  - Authentication（認証）
  - Firestore（リアルタイムデータベース）
  - Hosting（ホスティング）
- **UI**: Tailwind CSS
- **アイコン**: Lucide React
- **日付処理**: date-fns
- **通知**: React Hot Toast
- **PWA**: Vite Plugin PWA

## 🏗️ プロジェクト構造

```
src/
├── components/          # UIコンポーネント
│   ├── AuthComponent.tsx      # 認証画面
│   ├── WeeklyCalendar.tsx     # 週間カレンダー
│   ├── MemberManagement.tsx   # メンバー管理
│   ├── NoteModal.tsx          # メモ管理
│   └── NotificationSettings.tsx # 通知設定
├── services/           # Firebase連携
│   ├── firestoreService.ts    # Firestore操作
│   └── notificationService.ts # 通知管理
├── hooks/              # カスタムフック
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
└── config/
    └── firebase.ts     # Firebase設定
```

## 🎯 主要な特徴

### リアルタイム同期
- **瞬時の反映**: 一人が出席状況を変更すると、全員のデバイスに即座に反映
- **競合回避**: Firestoreのトランザクション機能で安全なデータ更新
- **オフライン対応**: ネット接続が復旧した際に自動同期

### セキュリティ
- **プライベートデータ**: 各家族のデータは完全に分離
- **認証必須**: 匿名認証でも最低限のセキュリティを確保
- **Firebaseルール**: サーバーサイドでのアクセス制御

### UX/UI
- **レスポンシブデザイン**: スマホ・タブレット・PCで最適表示
- **直感的操作**: タップで状態変更、ドラッグで週間移動
- **アクセシビリティ**: キーボードナビゲーション対応

## 🚀 本番デプロイ

### Firebase Hostingを使用
```bash
npm run build
firebase init hosting
firebase deploy
```

### Vercel/Netlifyを使用
```bash
npm run build
# dist/フォルダをアップロード
```

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストやIssueの報告をお待ちしています！

---

**🔥 本格的なFirebase連携により、家族全員がどこからでもリアルタイムで出席状況を共有できます！** 