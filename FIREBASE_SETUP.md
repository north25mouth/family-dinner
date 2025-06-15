# Firebase設定手順

## 1. Firebase CLIのインストール

```bash
npm install -g firebase-tools
```

## 2. Firebaseにログイン

```bash
firebase login
```

## 3. プロジェクトの初期化（既存プロジェクトの場合）

```bash
firebase use --add
# プロジェクトID: familydinner-ae09b を選択
# エイリアス: default
```

## 4. Firestoreルールのデプロイ

```bash
firebase deploy --only firestore:rules
```

## 5. Firestoreインデックスのデプロイ

```bash
firebase deploy --only firestore:indexes
```

## 6. 全体のデプロイ（必要に応じて）

```bash
firebase deploy
```

## 現在のFirestoreルール概要

- **users コレクション**: 誰でも読み取り・作成可能（認証のため）
- **families コレクション**: 認証済みユーザーのみアクセス可能
- **サブコレクション**: members, attendance, notes, notificationSettings

## セキュリティ設定

- ユーザーネーム認証では `family_{username}` をfamilyIdとして使用
- 同じユーザーネームでログインした端末は同じデータを共有
- 匿名ログインの場合は従来通りUIDベースのデータ分離

## トラブルシューティング

### 権限エラーが発生する場合
```bash
firebase login --reauth
```

### ルールの確認
```bash
firebase firestore:rules:get
``` 