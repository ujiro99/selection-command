# CLAUDE.md

This file provides guidance to AI Agent when working with code in this repository.

このファイルは、このリポジトリのコードを扱う際にAI Agentに対するガイダンスを提供します。

## 基本ルール

- **チャットの言語**: チャットの回答、ソースコード以外のドキュメント内の記述は日本語で行うこと
- **コードのスタイル**: TypeScriptのコーディング規約に従うこと。特に、変数名、関数名はキャメルケースを使用し、クラス名はパスカルケースを使用する。
- **コード内の言語**: コード内のコメントは英語で記述すること。
- **コードの品質**: コードは読みやすく、保守しやすいように書くこと。コメントは必要な箇所へ記載し、複雑なロジックには説明を加える。
- **テキストのエンコーディング**: UTF-8を使用すること。

## このパッケージの役割

`packages/hub` は、かつて Selection Command のコマンド共有・発見プラットフォーム
（Next.js 15 フル機能アプリ）でしたが、そのアプリケーションは新しいリポジトリ
（https://github.com/ujiro99/selection-command-hub、selection-command.com へデプロイ）に移行しました。

このパッケージに残っているのは、以下の3つの責務のみです。

1. **ai-services.json の静的ホスティング**
   - `public/data/ai-services.json` を GitHub Pages で静的配信する
   - Extension の AiPrompt コマンドが以下の2通りで参照する
     - ビルド時: `packages/extension/vite.config.ts` 等が
       `fs.readFileSync("../hub/public/data/ai-services.json")` で直接読み込む
     - 実行時: `packages/extension/src/services/aiPrompt.ts` が
       `${HUB_URL}/data/ai-services.json` に fetch する
   - このファイルを変更・削除する際は、必ず Extension 側のこれら2箇所への
     影響を確認すること

2. **experiments.json の静的ホスティング（ABテスト配信制御）**
   - `public/data/experiments.json` を GitHub Pages で静的配信する
   - Extension が実行時に `${HUB_URL}/data/experiments.json` へ fetch し、
     ABテストの variant 配分比率を決定する
     （`packages/extension/src/services/experiments/experimentConfig.ts`）
   - このファイルを編集して hub をデプロイするだけで、Chrome Web Store への
     再申請なしに配分比率の変更・実験の停止（`enabled: false`）ができる
   - 形式:
     ```json
     {
       "<experiment_id>": { "enabled": true, "allocation": 0.5 }
     }
     ```
     `allocation` は variant B に割り当てるユーザーの比率（0..1）

3. **e2e テスト用ページの配信**
   - `src/app/[lang]/test/page.tsx`（`/en/test` など）は、Extension の
     Playwright e2e テストが実際にデプロイされたページにアクセスして
     動作確認するためのテストページ
   - `packages/extension/e2e/pages/TestPage.ts` がこのページの URL を
     ハードコードしており、複数の spec ファイルから利用されている
   - このページ配下のコンポーネント（Header/Footer/LocaleSelector など）は、App Router のレイアウト要件を満たすために
     最小限残っているだけで、機能的な意味は薄い

## 開発コマンド

- `yarn dev` - Next.js開発サーバーの開始（Turbopack使用）
- `yarn build` - プロダクションビルド（GitHub Pages 用の静的エクスポート）
- `yarn start` - プロダクションサーバーの開始
- `yarn lint` - ESLintによるコード品質チェック
- `yarn test` / `test:run` / `test:coverage` - Vitest

## プロジェクト構造（縮小後）

- `public/data/ai-services.json` - Extension が参照するデータファイル
- `public/data/experiments.json` - Extension のABテスト配分設定
- `src/app/[lang]/test/` - e2e テストページ本体（`page.tsx`, `QuillWrapper.tsx`）
- `src/app/[lang]/layout.tsx`, `src/app/layout.tsx` - App Router の必須レイアウト（Header/Footer/LanguageProvider を保持）
- `src/features/locale/` - 14言語分の辞書ファイル（layout.tsx が
  無条件にバレルインポートするため削除できない）
- `src/components/ui/` - shadcn/ui のうち button, separator, select のみ残存
- `src/lib/utils.ts` - 共通ユーティリティ（`cn` 等、`@shared` からの re-export）

## 削除済みの機能

コマンド共有・検索・タグ・多言語ページ（privacy/terms/cookie）・
Google Analytics 連携・お問い合わせフォーム等は、全て新リポジトリ
（selection-command-hub）に移行済みで、このパッケージには存在しない。
関連する `commands.json`, `tags.json`, `searchUrls.json`, `pageActionIds.json`
等のデータファイルおよび生成スクリプト（旧 `scripts/update-tags.mjs` 等）も
削除済み。Footer 内の法的ページへのリンクも、対応するページの
削除に合わせて除去している。

## 開発時の注意事項

- このパッケージへの新機能追加は基本的に行わない。コマンド共有プラットフォーム
  としての機能拡張は新リポジトリ（selection-command-hub）側で行うこと
- `public/data/ai-services.json` を編集する場合は、Extension 側
  （vite.config.ts の `__AI_SERVICES_JSON__` define、aiPrompt.ts の fetch）が
  壊れないことを確認すること
- `src/app/[lang]/test/page.tsx` を変更する場合は、`packages/extension/e2e/` の
  対応する spec が壊れないことを確認すること（本番反映後の e2e 実行で最終確認）
