# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

このファイルは、このリポジトリのコードを扱う際にClaude Code (claude.ai/code)に対するガイダンスを提供します。

## 基本ルール

- **チャットの言語**: チャットの回答、ソースコード以外のドキュメント内の記述は日本語で行うこと
- **コードのスタイル**: TypeScriptのコーディング規約に従うこと。特に、変数名、関数名はキャメルケースを使用し、クラス名はパスカルケースを使用する。
- **コード内の言語**: コード内のコメントは英語で記述すること。
- **コードの品質**: コードは読みやすく、保守しやすいように書くこと。コメントは必要な箇所へ記載し、複雑なロジックには説明を加える。
- **テキストのエンコーディング**: UTF-8を使用すること。

## 開発コマンド

- `yarn dev` - Next.js開発サーバーの開始（Turbopack使用）
- `yarn build` - プロダクションビルドの実行
- `yarn start` - プロダクションサーバーの開始
- `yarn lint` - Next.js ESLintによるコード品質チェック
- `yarn analytics` - Google Analyticsからデータを取得してanalyticsファイルを更新
- `yarn tags` - commands.jsonからタグ情報を抽出してtags.jsonを更新
- `yarn urls` - searchUrlsファイルを更新

## アーキテクチャ概要

これは**Selection Command Hub**と呼ばれるNext.js 15アプリケーションで、
Chrome拡張機能である、`Selection Command` のコマンド共有・発見プラットフォームとして機能します。

### 主要機能

- **コマンドライブラリ**: 検索URL、ページアクションなどの共有可能なコマンドのカタログ
- **多言語対応**: 11言語に対応した国際化機能
- **タグベース検索**: コマンドのカテゴライズと検索機能
- **分析機能**: Google Analytics統合による使用状況の追跡
- **レスポンシブデザイン**: モバイル・デスクトップ対応のUI

### プロジェクト構造

**App Router構造** (`src/app/`):

- `page.tsx` - ルートページ（英語デフォルト）
- `[lang]/` - 国際化対応のページ群
  - `page.tsx` - メインコマンドリストページ
  - `tag/[tag]/` - タグ別コマンド表示
  - `privacy/`, `terms/`, `cookie/` - 法的ページ（各言語対応）
  - `uninstall/` - アンインストール理由収集ページ

**機能別モジュール** (`src/features/`):

- `command.ts` - コマンド操作とフィルタリングのビジネスロジック
- `tag.ts` - タグ関連機能
- `locale/` - 多言語対応のメッセージファイル

**コンポーネント** (`src/components/`):

- `ui/` - shadcn/uiベースの再利用可能UIコンポーネント
- `layout/` - ヘッダー、フッター、コマンドリスト等のレイアウトコンポーネント
- `pageAction/` - ページアクション表示専用コンポーネント
- `CommandForm.tsx` - コマンド追加フォーム
- `CookieConsent.tsx` - Cookie同意管理

**データ管理** (`src/data/`):

- `commands.json` - コマンドのマスターデータ
- `tags.json` - タグ統計（スクリプトで自動生成）
- `analytics.json` - GA分析データ（スクリプトで自動生成）

**型定義** (`src/types/`):

- `pageAction.ts` - ページアクション関連の詳細な型定義
- `schema.ts` - フォームバリデーション用スキーマ

### 技術スタック

- **フレームワーク**: Next.js 15 with App Router
- **React**: React 19 RC
- **スタイリング**: Tailwind CSS + shadcn/ui コンポーネント
- **フォーム**: react-hook-form + zod バリデーション
- **国際化**: カスタム実装（src/features/locale）
- **分析**: Google Analytics Data API
- **アニメーション**: Tailwind CSS + カスタムキーフレーム
- **SEO**: next-sitemap による自動サイトマップ生成

### データフロー

1. **コマンドデータ**: `src/data/commands.json` → フィルタリング・検索 → UI表示
2. **タグ統計**: commands.json → `scripts/update-tags.mjs` → `src/data/tags.json`
3. **分析データ**: Google Analytics → `scripts/fetch-ga-data.js` → `src/data/analytics.json`
4. **検索URL**: 動的生成 → `scripts/update-searchUrls.mjs` → `public/data/searchUrls.json`

### 国際化の仕組み

- **URLベース**: `/[lang]/` 動的ルートで言語切り替え
- **メッセージファイル**: `src/features/locale/[lang].ts` で各言語の翻訳を管理
- **フォールバック**: 英語（en）をデフォルト言語として使用
- **法的ページ**: privacy、terms、cookieページは各言語版を個別ファイルで管理

### ビルド・デプロイメント

- **ビルド後処理**: サイトマップ生成、タグ更新、検索URL更新を自動実行
- **静的生成**: 基本的にSSGで高速化
- **分析更新**: 手動でanalytics scriptを実行してデータ更新

### 開発時の注意事項

- このプロジェクトは拡張機能のメインコード（`../src/`）とは完全に独立
- 新しいコマンドは`src/data/commands.json`に手動追加
- タグ統計は`yarn tags`で自動更新される
- 多言語対応時は各言語ファイルの更新が必要
- ページアクション型コマンドは複雑な型定義（`src/types/pageAction.ts`）を使用
