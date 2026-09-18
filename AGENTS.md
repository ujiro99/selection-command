# AGENTS.md

このファイルは、このリポジトリのコードを扱う際にAI Agentに対するガイダンスを提供します。

## 基本ルール

- **チャットの言語**: チャットの回答、ソースコード以外のドキュメント内の記述は日本語で行うこと
- **コードのスタイル**: TypeScriptのコーディング規約に従うこと。特に、変数名、関数名はキャメルケースを使用し、クラス名はパスカルケースを使用する。
- **コード内の言語**: コード内のコメントは英語で記述すること。
- **コードの品質**: コードは読みやすく、保守しやすいように書くこと。コメントは必要な箇所へ記載し、複雑なロジックには説明を加える。
- **テキストのエンコーディング**: UTF-8を使用すること。

## モノレポ構造

このリポジトリは**Selection Command**プロジェクトのモノレポで、以下の3つのパッケージで構成されています：

### パッケージ構成

1. **packages/extension** (`@selection-command/extension`)
   - Chrome拡張機能のメインコード
   - Manifest V3対応
   - React + TypeScript + Vite

2. **packages/hub** (`@selection-command/hub`)
   - `ai-services.json` の静的ホスティング + Extension の e2e テストページ配信のみを担う縮小版 Next.js アプリ
   - コマンド共有プラットフォームとしてのフル機能は新リポジトリ（[selection-command-hub](https://github.com/ujiro99/selection-command-hub)、selection-command.com）に移行済み
   - 詳細は `packages/hub/AGENTS.md` を参照

3. **packages/shared** (`@selection-command/shared`)
   - 共通ユーティリティと型定義
   - extension と hub で共有される基本型

## 開発コマンド（ルートレベル）

```bash
# 拡張機能の開発
yarn dev                   # extensionの開発モード開始
yarn dev:hub               # hub（テストページ/ai-services.json配信用）の開発モード開始

# ビルド
yarn build                 # 全パッケージのビルド
yarn build:extension       # extensionのみビルド
yarn build:hub             # hubのみビルド

# 品質チェック
yarn lint                  # 全パッケージのlint実行
yarn test                  # 全パッケージのテスト実行

# その他
yarn clean                 # 全パッケージのクリーンアップ
```

### パッケージ別コマンド

各パッケージディレクトリ内では、以下のコマンドが使用できます：

**Extension (packages/extension):**

```bash
yarn dev                   # 開発モード
yarn build                 # ビルド
yarn build:e2e             # e2e用にビルド
yarn test                  # テスト実行
yarn test:ui               # テストUIモード
yarn test:coverage         # カバレッジ測定
yarn test:e2e              # playwright test
yarn lint                  # ESLint実行
yarn zip                   # 配布用zip作成
```

**Hub (packages/hub):**

```bash
yarn dev                   # Next.js開発サーバー（Turbo）
yarn build                 # プロダクションビルド
```

**Shared (packages/shared):**

```bash
yarn build                 # TypeScriptコンパイル
yarn dev                   # watch モード
```

## アーキテクチャ概要

**Selection Command**は、Webページ上で選択したテキストに対してさまざまなアクションを実行できるChrome拡張機能です。

### システム全体の構成

```
┌────────────────────────┐    ┌─────────────────────┐
│   Chrome Extension     │    │  Hub（静的アセット）│
│   (packages/ext)       │◄──►│   (packages/hub)    │
│                        │    │                     │
│ • コンテンツスクリプト │    │ • ai-services.json  │
│ • バックグラウンド     │    │   配信              │
│ • オプションページ     │    │ • e2eテストページ   │
│ • ページアクション     │    │                     │
└────────────────────────┘    └─────────────────────┘
             │
             │
  ┌─────────────────────┐
  │   Shared Package    │
  │  (packages/shared)  │
  │                     │
  │ • 共通型定義        │
  │ • ユーティリティ    │
  │ • 型ガード          │
  └─────────────────────┘
```

※ コマンド共有・検索・発見のプラットフォーム（旧 Command Hub のフル機能）は
新リポジトリ（selection-command-hub）に移行済み。上記の `packages/hub` は
その旧実装の残骸ではなく、Extension が依存する静的アセット配信専用に縮小した別物。

### 主要な連携ポイント

1. **型システム共有**: SharedパッケージでBaseCommandなどの基本型を定義し、ExtensionとHubで拡張
2. **AIサービス定義**: `packages/hub/public/data/ai-services.json` を Extension がビルド時/実行時の両方で参照
3. **ABテスト配分設定**: `packages/hub/public/data/experiments.json` を Extension が実行時に参照し、オンボーディング等のABテストの配分比率を制御
4. **e2eテスト**: `packages/hub` がデプロイする `/en/test` ページを Extension の Playwright テストが利用

### Chrome拡張機能の構造 (packages/extension)

**コア機能:**

- **ページアクション**: ブラウザ自動化シーケンスの記録と再生
- **コンテキストメニュー**: 選択テキストに対する右クリックアクション
- **IPC通信**: content script ↔ background script ↔ options page
- **設定管理**: Chrome Storage API使用、インポート/エクスポート対応

**主要コンポーネント:**

- `src/background_script.ts` - サービスワーカー（Manifest V3）
- `src/content_script.tsx` - Webページ注入スクリプト
- `src/options_page.tsx` - 設定UI
- `src/services/ipc.ts` - プロセス間通信の中核
- `src/services/pageAction/` - 自動化シーケンス処理
- `src/lib/robula-plus/` - 堅牢なXPathセレクター生成

### Hub の構造 (packages/hub)

`packages/hub` は「ai-services.json の静的ホスティング」と「Extension の
e2eテストページ配信」のみを担う縮小版アプリ。詳細は `packages/hub/AGENTS.md`
を参照。

### 型システムの設計

**Shared Package**での基本定義:

```typescript
interface BaseCommand {
  id: string
  title: string
  openMode: OPEN_MODE
  // ... 基本プロパティ
}

interface PageActionCommand extends BaseCommand {
  pageActionOption: unknown // パッケージごとに具体化
}
```

**Extension Package**での拡張:

```typescript
interface PageActionOption {
  startUrl: string
  openMode: PAGE_ACTION_OPEN_MODE
  steps: Array<PageActionStep>
}
```

### 開発時の注意事項

**型の取り扱い:**

- SharedパッケージのPageActionCommand.pageActionOptionは`unknown`型
- Extension内では`(command.pageActionOption as any)`等の型アサーションが必要
- 新しい共通型はSharedパッケージで定義し、yarn buildで各パッケージに反映

**Chrome拡張機能開発:**

- Manifest V3の制約に注意（CSP、service worker等）
- Shadow DOMでスタイル分離
- Chrome Storage APIの制限（QUOTA_BYTES等）

**Hub開発:**

- Hub は縮小版のため新機能は追加しない。コマンド共有プラットフォームとしての機能拡張は新リポジトリ（selection-command-hub）側で行う
- `ai-services.json` / `experiments.json` とテストページの変更時は Extension 側への影響を確認すること

**テスト:**

- Extensionでは Chrome API のモック使用
- テストファイルは`src/**/*.{test,spec}.{ts,tsx}`パターン
- カバレッジ測定は`yarn test:coverage`

**ビルド・配布:**

- Extension: `yarn zip`で配布用zipファイル作成
- Hub: GitHub Pages（`.github/workflows/pages.yml`）で静的サイト配布
- Shared: TypeScript declarations自動生成
