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
   - コマンド共有・発見のWebプラットフォーム
   - Next.js 15 + App Router
   - 11言語対応の国際化

3. **packages/shared** (`@selection-command/shared`)
   - 共通ユーティリティと型定義
   - extension と hub で共有される基本型

## 開発コマンド（ルートレベル）

```bash
# 拡張機能の開発
yarn dev                   # extensionの開発モード開始
yarn dev:hub               # hubの開発モード開始

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
yarn test                  # テスト実行
yarn test:ui               # テストUIモード
yarn test:coverage         # カバレッジ測定
yarn lint                  # ESLint実行
yarn zip                   # 配布用zip作成
```

**Hub (packages/hub):**

```bash
yarn dev                   # Next.js開発サーバー（Turbo）
yarn build                 # プロダクションビルド
yarn analytics             # GA分析データ更新
yarn tags                  # タグ統計更新
yarn urls                  # 検索URL更新
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
│   Chrome Extension     │    │    Command Hub      │
│   (packages/ext)       │◄──►│   (packages/hub)    │
│                        │    │                     │
│ • コンテンツスクリプト │    │ • コマンド共有      │
│ • バックグラウンド     │    │ • 検索・発見        │
│ • オプションページ     │    │ • 多言語対応        │
│ • ページアクション     │    │ • 分析機能          │
└────────────────────────┘    └─────────────────────┘
           │                            │
           └──────────┬─────────────────┘
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

### 主要な連携ポイント

1. **型システム共有**: SharedパッケージでBaseCommandなどの基本型を定義し、ExtensionとHubで拡張
2. **コマンドデータ**: Hubで管理するcommands.jsonをExtensionで参照
3. **国際化**: Hubの多言語対応とExtensionのlocalesファイルが連携
4. **ページアクション**: ExtensionのPageActionがHubで共有・発見される

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

### Hubプラットフォームの構造 (packages/hub)

**機能:**

- コマンドライブラリの検索・発見
- タグベースでのカテゴライズ
- Google Analytics統合
- 11言語の国際化対応

**データフロー:**

```
commands.json → フィルタリング・検索 → UI表示
commands.json → scripts/update-tags.mjs → tags.json
Google Analytics → scripts/fetch-ga-data.js → analytics.json
```

### 型システムの設計

**Shared Package**での基本定義:

```typescript
interface BaseCommand {
  id: string;
  title: string;
  openMode: OPEN_MODE;
  // ... 基本プロパティ
}

interface PageActionCommand extends BaseCommand {
  pageActionOption: unknown; // パッケージごとに具体化
}
```

**Extension Package**での拡張:

```typescript
interface PageActionOption {
  startUrl: string;
  openMode: PAGE_ACTION_OPEN_MODE;
  steps: Array<PageActionStep>;
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

- commands.jsonの手動更新後は`yarn tags`でタグ統計更新
- 多言語対応時は各言語ファイルの更新が必要
- 分析データは`yarn analytics`で手動更新

**テスト:**

- Extensionでは Chrome API のモック使用
- テストファイルは`src/**/*.{test,spec}.{ts,tsx}`パターン
- カバレッジ測定は`yarn test:coverage`

**ビルド・配布:**

- Extension: `yarn zip`で配布用zipファイル作成
- Hub: Vercel等での静的サイト配布
- Shared: TypeScript declarations自動生成
