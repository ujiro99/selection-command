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

`packages/pages` は、かつて Selection Command のコマンド共有・発見プラットフォーム
（Next.js 15 フル機能アプリ）でしたが、そのアプリケーションは新しいリポジトリ
（https://github.com/ujiro99/selection-command-hub、selection-command.com へデプロイ）に移行しました。

このパッケージに残っているのは、以下の4つの責務のみです。

1. **ai-services.json の静的ホスティング**
   - `public/data/ai-services.json` を GitHub Pages で静的配信する
   - Extension の AiPrompt コマンドが以下の2通りで参照する
     - ビルド時: `packages/extension/vite.config.ts` 等が
       `fs.readFileSync("../pages/public/data/ai-services.json")` で直接読み込む
     - 実行時: `packages/extension/src/services/aiPrompt.ts` が
       `${HUB_URL}/data/ai-services.json` に fetch する
   - このファイルを変更・削除する際は、必ず Extension 側のこれら2箇所への
     影響を確認すること

2. **experiments.json の静的ホスティング（ABテスト配信制御）**
   - `public/data/experiments.json` を GitHub Pages で静的配信する
   - Extension が実行時に `${HUB_URL}/data/experiments.json` へ fetch し、
     ABテストの variant 配分比率を決定する
     （`packages/extension/src/services/experiments/experimentConfig.ts`）
   - このファイルを編集して pages をデプロイするだけで、Chrome Web Store への
     再申請なしに配分比率の変更・実験の停止（`enabled: false`）ができる
   - 形式:
     ```json
     {
       "<experiment_id>": { "enabled": true, "allocation": 0.5 }
     }
     ```
     `allocation` は treatment 側の variant（現在の `onboarding_v5` では variant E。対照群は variant C）に
     割り当てるユーザーの比率（0..1）
   - Extension 側には pages 障害時用のフォールバック値が
     `packages/extension/src/services/experiments/experimentConfig.ts` の
     `DEFAULT_CONFIGS` に定義されている。配分比率を恒久的に変更する場合は、
     こちらも合わせて更新しないと pages 障害時だけ古い比率で割り当てられる

3. **e2e テスト用ページの配信**
   - `src/app/[lang]/test/page.tsx`（`/en/test` など）は、Extension の
     Playwright e2e テストが実際にデプロイされたページにアクセスして
     動作確認するためのテストページ
   - `packages/extension/e2e/pages/TestPage.ts` がこのページの URL を
     ハードコードしており、複数の spec ファイルから利用されている
   - このページ配下のコンポーネント（Header/Footer/LocaleSelector など）は、App Router のレイアウト要件を満たすために
     最小限残っているだけで、機能的な意味は薄い

4. **Chrome Web Store 用プロモーション画像の作成**
   - `src/app/[lang]/store-image/[slide]/page.tsx`（`/ja/store-image/1` 〜 `/ja/store-image/5`）は、
     Chrome Web Store に登録する画像（1280x800）を HTML/CSS で描画するためのページ。
     `[lang]` は `src/features/locale` の14言語
   - `/{lang}/store-image` は全スライドを 50%（ストアのプレビューと同じ 640x400）で並べる一覧ページ。
     各スライドの「Export」ボタン、または「Export all」で PNG を書き出せる（html-to-image を使用。
     開発インジケーターは写り込まない）。ファイル名は `ja_01_hero.png` のように言語コードが先頭に付く。
     右下の LocaleSelector で言語を切り替えられる
   - スライドの中身は `src/app/[lang]/store-image/_slides/`、共通部品は `_components/parts.tsx`。
     スライドの追加・並べ替え・書き出しファイル名は `_slides/index.ts` の `SLIDES` で管理する
   - コピーは各言語の辞書ファイル（`src/features/locale/*.ts`）の `storeImage` に書く。
     スライドは `t`（その言語の `storeImage`）を props で受け取る。長い訳文は `Fit` が
     指定幅に収まるよう縮小するので、`Headline` / `Sub` には `maxWidth` を指定する
   - 言語ごとのフォントは `store.module.css` の `.canvas:lang(...)` で指定する
     （ヒラギノは中国語・韓国語・ヒンディー語の字形が合わず、ロシア語は全角幅になるため）
   - 設定画面のスクリーンショットは日本語 UI のまま全言語で使っている
   - 製品 UI は作り直さず、実際のスクリーンショット（`public/store-image/screenshots/`）を
     切り抜き・拡大して使う。UI が変わったらスクリーンショットを差し替える
   - デザイン方針は `.claude/skills/chrome-store-screenshots` の Design rules に従う
     （隣り合うスライドでレイアウト・背景色を変える、1枚1メッセージ、機能一覧を載せない 等）
   - dev サーバー起動中に `yarn build` すると `.next` が上書きされて dev サーバーが 500 を返すため、
     dev サーバーを止めてからビルドすること
   - 日本語フォントはシステムフォント（ヒラギノ角ゴ等）に依存するため、macOS での書き出しを前提とする
   - `noindex` を指定している。Header/Footer は `src/app/[lang]/(site)/layout.tsx`（route group）にあり、
     store-image には適用されない

## 開発コマンド

- `yarn dev` - Next.js開発サーバーの開始（Turbopack使用）
- `yarn build` - プロダクションビルド（GitHub Pages 用の静的エクスポート）
- `yarn start` - プロダクションサーバーの開始
- `yarn lint` - ESLintによるコード品質チェック
- `yarn test` / `test:run` / `test:coverage` - Vitest

## プロジェクト構造（縮小後）

- `public/data/ai-services.json` - Extension が参照するデータファイル
- `public/data/experiments.json` - Extension のABテスト配分設定
- `src/app/[lang]/(site)/test/` - e2e テストページ本体（`page.tsx`, `QuillWrapper.tsx`）。URL は `/{lang}/test` のまま
- `src/app/[lang]/(site)/layout.tsx` - テストページ用の Header/Footer
- `src/app/[lang]/store-image/` - Chrome Web Store 用画像ページ（`/{lang}/store-image/1`〜`5` と一覧）
- `src/components/Logo.tsx` - ロゴ（selection-command-hub から移植。store-image で使用）
- `src/app/[lang]/layout.tsx`, `src/app/layout.tsx` - App Router の必須レイアウト（言語の静的パラメータ、LanguageProvider を保持）
- `src/features/locale/` - 14言語分の辞書ファイル（layout.tsx が
  無条件にバレルインポートするため削除できない）
- `src/components/MovedNotice.tsx` - ルートページと 404 ページで共有する移転案内
- `src/lib/utils.ts` - 共通ユーティリティ（`@shared` からの re-export 等）
- `src/app/globals.css` + 各 `*.module.css` - スタイル（素の CSS のみ。下記参照）

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
  - デプロイ前の確認は、`yarn build` した `out/` をローカルで配信し、
    `E2E_HUB_BASE_URL` を指定して extension の e2e を実行する
    （例: `python3 -m http.server 3100 -d packages/pages/out` →
    `E2E_HUB_BASE_URL=http://localhost:3100 yarn test:e2e`）。
    `ujiro99.github.io` へのリクエストがローカルへ転送される
    （`packages/extension/e2e/utils/hubRoute.ts`）。ただし拡張機能が自ら開く
    ウィンドウ（PageAction の録画画面など）は転送できず、デプロイ済みのページが表示される
- スタイリングは素の CSS（`globals.css` と CSS Modules）のみで行う。
  Tailwind CSS や shadcn/ui などの CSS フレームワーク・UI ライブラリは導入しない
  （テストページと設定値のホスティングのみが目的で、導入するメリットがないため）
- テストページの DOM 構造（見出し、`data-testid`、`placeholder`、文言など）は
  e2e が参照しているため、スタイル変更時も維持すること
