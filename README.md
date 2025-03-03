# Smart Rounder

Smart Rounder は、日常の生産性向上のための統合型アプリケーションです。タスク管理、メモ、カレンダー、アラーム、YouTube、Web検索、天気予報など、複数の機能を1つのアプリでシームレスに提供します。

## 機能

### タスク管理
- タスクの作成、編集、削除
- カテゴリによる整理
- 優先度設定
- 締め切り日の設定
- タスクの完了状態の追跡

### メモ機能
- テキストメモの作成と編集
- メモのピン留め
- フォルダによる整理
- 色分け機能

### カレンダー機能
- 日付ベースのイベント管理
- 月表示、週表示、日表示
- イベントのリマインダー設定
- デバイスカレンダーとの同期

### アラーム機能
- 定期的および一回限りのアラーム
- カスタムサウンド選択
- スヌーズ機能
- 徐々に音量を上げる機能

### その他の機能
- YouTube閲覧（アプリ内ブラウザ）
- Web検索（Googleなど）
- 天気予報の確認
- ダークモード対応
- 複数デバイス間のデータ同期

## 技術スタック

- **フレームワーク**: React Native, Expo
- **状態管理**: Zustand
- **UI コンポーネント**: React Native Paper
- **ナビゲーション**: React Navigation
- **データ永続化**: AsyncStorage, SQLite, SecureStore
- **Web閲覧**: React Native WebView
- **通知**: Expo Notifications
- **カレンダー統合**: Expo Calendar

## 開始方法

### 前提条件

- Node.js (v16以上)
- npm または yarn
- Expo CLI
- Android StudioまたはXcode（物理デバイスがない場合）

### インストール

1. リポジトリをクローンします

```bash
git clone https://github.com/ZundamonnoVRChatkaisetu/smart-rounder.git
cd smart-rounder
```

2. 依存関係をインストールします

```bash
npm install
# または
yarn install
```

3. アプリを起動します

```bash
npx expo start
```

4. 表示されるQRコードをExpo Go（モバイル）でスキャンするか、エミュレータで開きます

## Windowsビルド

WindowsビルドにはExpo for Windowsを使用します。

```bash
npm install -g expo-cli
npm run web
```

## Androidビルド

```bash
npx expo build:android
```

## iOS ビルド

```bash
npx expo build:ios
```

## プロジェクト構造

```
smart-rounder/
├── assets/                  # アイコン、スプラッシュ画像など
├── src/
│   ├── components/          # 再利用可能なUIコンポーネント
│   ├── contexts/            # React Contextプロバイダー
│   │   ├── AuthContext.tsx  # 認証コンテキスト
│   │   ├── ThemeContext.tsx # テーマコンテキスト
│   │   └── NotificationContext.tsx # 通知コンテキスト
│   ├── models/              # データモデル
│   │   ├── Task.ts
│   │   ├── Note.ts
│   │   ├── Calendar.ts
│   │   └── Alarm.ts
│   ├── navigation/          # 画面ナビゲーション
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── feature/        # 機能ごとのナビゲーター
│   ├── screens/             # アプリ画面
│   │   ├── auth/           # 認証関連画面
│   │   ├── tasks/          # タスク管理画面
│   │   ├── notes/          # メモ画面
│   │   ├── calendar/       # カレンダー画面
│   │   ├── alarm/          # アラーム画面
│   │   ├── settings/       # 設定画面
│   │   └── more/           # その他の追加機能画面
│   ├── stores/              # Zustandストア
│   │   ├── useTaskStore.ts
│   │   ├── useNoteStore.ts
│   │   ├── useCalendarStore.ts
│   │   └── useAlarmStore.ts
│   └── utils/              # ユーティリティ関数
├── App.tsx                 # アプリのエントリーポイント
├── app.json                # Expo設定
└── package.json            # 依存関係とスクリプト
```

## 将来の展望

- Apple Watchおよび他のウェアラブルデバイスとの連携
- 音声コマンドのサポート
- AIベースのタスク推奨
- チーム協力機能
- さらなるカスタマイズオプション

## ライセンス

このプロジェクトはMITライセンスのもとで公開されています。
