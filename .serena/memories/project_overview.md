# Selection Command プロジェクト概要

## プロジェクトの目的

Selection Commandは、ユーザーがWebページ上で選択したテキストに対してさまざまなアクションを実行できるChrome拡張機能（Manifest V3）です。

## 技術スタック

- **フロントエンド**: React 18 with TypeScript
- **ビルドシステム**: Vite with `@crxjs/vite-plugin` for Chrome extension development
- **UIコンポーネント**: Shadcn UI, Radix UI
- **フォームとバリデーション**: react-hook-form and zod
- **スタイリング**: CSS Modules + Tailwind CSS (ver.3)
- **状態管理**: React hooks with Chrome extension storage APIs
- **テスト**: Vitest with jsdom for unit/integration testing
- **コード品質**: ESLint for code quality
- **エラー監視**: Sentry

## 主要コンポーネント

- `manifest.json` - 拡張機能のマニフェスト
- `src/background_script.ts` - サービスワーカー
- `src/content_script.tsx` - メインのコンテンツスクリプト
- `src/options_page.tsx` - 拡張機能のオプション/設定ページ

## コアアーキテクチャ

- **Actions** (`src/action/`) - バックグラウンド操作、ポップアップ処理、ページアクション、コマンド実行
- **Components** (`src/components/`) - 機能別React コンポーネント
- **Services** (`src/services/`) - ビジネスロジックとユーティリティ（IPC含む）
- **Hooks** (`src/hooks/`) - 状態管理とChrome拡張機能APIのためのカスタムReactフック
- **Testing** (`src/test/`) - テスト環境のセットアップとモック設定
