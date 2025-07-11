# CLAUDE.md

このファイルは、このリポジトリのコードを扱う際にClaude Code (claude.ai/code)に対するガイダンスを提供します。

## 開発コマンド

- `yarn dev` - Viteを使用した開発モードの開始
- `yarn build` - 拡張機能のビルド（TypeScriptコンパイル + Viteビルドを実行）
- `yarn lint` - ESLintを実行してコード品質をチェック
- `yarn test` - Vitestを使用したテストの実行
- `yarn test:ui` - VitestのUIモードでテストを実行
- `yarn test:coverage` - テストカバレッジを測定
- `yarn zip` - ビルドされたdistフォルダから配布可能な拡張機能のzipファイルを作成

## アーキテクチャ概要

これは**Selection Command**と呼ばれるChrome拡張機能（Manifest V3）で、ユーザーがWebページ上で選択したテキストに対してさまざまなアクションを実行できます。

### 主要コンポーネント

**Chrome拡張機能の構造:**

- `manifest.json` - 権限、コンテンツスクリプト、バックグラウンドワーカーを定義する拡張機能マニフェスト
- `src/background_script.ts` - 拡張機能のライフサイクルとバックグラウンド操作を処理するサービスワーカー
- `src/content_script.tsx` - Webページに注入されるメインのコンテンツスクリプト
- `src/options_page.tsx` - 拡張機能のオプション/設定ページ

**コアアーキテクチャ:**

- **Actions** (`src/action/`) - バックグラウンド操作、ポップアップ処理、ページアクション、コマンド実行を含むコア機能モジュール
- **Components** (`src/components/`) - 機能別に整理されたReactコンポーネント:
  - `menu/` - コンテキストメニューとメニューアイテムコンポーネント
  - `option/` - 設定と構成UI
  - `pageAction/` - ページ自動化と記録コンポーネント
  - `result/` - 結果表示とポップアップコンポーネント
  - `ui/` - 再利用可能なUIコンポーネント（Radix UIを使用）
- **Services** (`src/services/`) - 設定管理、ストレージ、分析、ページアクション処理を含むビジネスロジックとユーティリティ
- **Hooks** (`src/hooks/`) - 状態管理とChrome拡張機能APIのためのカスタムReactフック
- **Testing** (`src/test/`) - テスト環境のセットアップとモック設定
  - `setup.ts` - Vitestのセットアップファイル（Chrome拡張機能APIのモック、jsdom環境設定）
  - `**/*.test.{ts,tsx}` - コンポーネントとサービスのユニットテスト
  - `**/*.spec.{ts,tsx}` - 統合テストとE2Eテスト

**主要機能:**

- **ページアクション** - ブラウザ自動化シーケンスの記録と再生
- **コマンドハブ** - コマンドの共有と発見のためのWebインターフェース（`pages/`内の独立したNext.jsアプリ）
- **コンテキストメニュー** - 選択したテキストに対する右クリックアクション
- **設定管理** - 構成とユーザー設定のインポート/エクスポート

### 技術スタック

- **フロントエンド**: React 18 with TypeScript
- **ビルドシステム**: Vite with `@crxjs/vite-plugin` for Chrome extension development
- **UIコンポーネント**: Shadcn
- **フォームとバリデーション**: react-hook-form and zod
- **スタイリング**: CSS Modules + Tailwind CSS(ver.3)
- **状態管理**: React hooks with Chrome extension storage APIs
- **テスト**: Vitest with jsdom for unit/integration testing
- **コード品質**: ESLint for code quality

### プロジェクト構造の注意事項

- メインの拡張機能コードは`src/`内にある
- コマンドハブのウェブサイトは`pages/`内の独立したNext.jsアプリケーション
- 拡張機能は`public/_locales/`のロケールファイルによる国際化をサポート
- コンテンツスクリプトのスタイリング分離にShadow DOMを使用
- 堅牢なXPathセレクター生成のためのRobula+アルゴリズムを実装（`src/lib/robula-plus/`）

### テスト環境

- **テストフレームワーク**: Vitest with jsdom環境
- **テスト設定**: `vitest.config.ts`で設定、`src/test/setup.ts`でモック設定
- **Chrome拡張機能モック**: `chrome.storage`、`chrome.runtime`、`chrome.tabs`等のAPIをモック
- **テストファイル**: `src/**/*.{test,spec}.{ts,tsx}`パターンで配置
- **カバレッジ**: `yarn test:coverage`でテストカバレッジを測定可能
