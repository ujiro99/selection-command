# Plan: Tailwind CSS v4 への移行（extension）と Hub からの Tailwind 撤去

- Issue: [#497 tailwindcss v4系への移行](https://github.com/ujiro99/selection-command/issues/497)
- 参照: [Tailwind CSS Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

## Context

現在は Tailwind CSS v3（root `^3.4.17` / hub `^3.4.1`）を使用している。v4 は CSS-first な設定（`@theme`）、新エンジン、ネイティブ Cascade Layers / `@property` / `color-mix()` を前提とした大型アップデートであり、設定方法・ユーティリティ名・デフォルトスタイルに破壊的変更がある。

本対応は 1 つの PR で以下の 2 つを行う。

1. **extension**: Tailwind CSS v4 へ移行する。
2. **hub**: Tailwind CSS の使用をやめ、素の CSS（CSS Modules + グローバル CSS）に置き換える。hub の役割はテストページと設定値（`ai-services.json` / `experiments.json`）のホスティングのみであり、Tailwind を導入しておくメリットがないため。

### 現状の構成

| 項目                        | 内容                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 共通設定                    | `/tailwind.config.js`（shadcn 系のカラートークン、`borderRadius`、`fontFamily`、`tailwindcss-animate`、`darkMode: ["class"]`、`container`）。extension と hub が spread して利用                                                           |
| extension                   | `packages/extension/tailwind.config.js` が共通設定を spread して拡張（独自 keyframes/animation 多数、`fontSize` / `padding` / `translate` / `minWidth` を **px で上書き**、`listStyleType`）                                               |
| hub                         | `packages/hub/tailwind.config.ts` が共通設定を spread して拡張（`chart` カラー、`scalePop` 等の keyframes、`data` variant）                                                                                                                |
| PostCSS                     | extension: `postcss.config.cjs`（`tailwindcss` + `autoprefixer`） / hub: `postcss.config.mjs`（`tailwindcss`）                                                                                                                             |
| エントリ CSS                | extension: `src/components/global.css`（`@import "tailwindcss/base"` 等）→ `App.css` から `@import` / hub: `src/app/globals.css`（`@tailwind base` 等）                                                                                    |
| `@apply` を使う CSS Modules | extension 8 ファイル（`Popup` / `TableOfContents` / `HubBanner` / `ShortcutList` / `Option` / `CommandEditDialog` / `PageActionRecorder` / `help`）、hub 2 ファイル（`page` / `Header`）                                                   |
| 関連ライブラリ              | `tailwind-merge ^2.5`（shared の `cn()`、extension、hub）、`tailwindcss-animate ^1.0.7`、`class-variance-authority`、shadcn/ui（extension の `components/ui/*`、hub の `components/ui/*` と `components.json`）                            |
| ビルド                      | extension: Vite 6 + crxjs。content script の CSS は manifest から除去し、Shadow DOM（`#selection-command`）へ手動注入（`content_script.tsx` / `vite-plugin-manifest.ts`）。dev 時は `vite-plugin-css-injected-by-js` で Shadow root へ注入 |

### extension で v4 の影響を受けるクラスの使用状況（概算、`src` 配下の grep 件数）

| v3 クラス                                                       | v4 での扱い                         | 件数        |
| --------------------------------------------------------------- | ----------------------------------- | ----------- |
| `shadow-sm` / `shadow`                                          | `shadow-xs` / `shadow-sm`           | 9 / ~60     |
| `rounded-sm` / `rounded`                                        | `rounded-xs` / `rounded-sm`         | 17 / ~144   |
| `blur` / `backdrop-blur`                                        | `blur-sm` / `backdrop-blur-sm`      | ~13 / 3     |
| `outline-none`                                                  | `outline-hidden`                    | 16          |
| `ring`                                                          | `ring-3`（v4 の `ring` は 1px）     | ~45         |
| `flex-shrink-*`                                                 | `shrink-*`                          | 1           |
| `space-x/y-*`                                                   | セレクタ変更（`:not(:last-child)`） | 36          |
| `bg-gradient-to-*`                                              | `bg-linear-to-*`                    | 1+          |
| `!` important 修飾子 / `bg-[--var]` / `theme()` / `*-opacity-*` | —                                   | 0           |
| `container` ユーティリティ                                      | —                                   | 0（未使用） |

※ `shadow` / `rounded` / `ring` などはコメントや変数名の誤検出を含むため概数。正確な置換はアップグレードツールに任せ、差分をレビューする。

### hub で Tailwind を使用している箇所

| ファイル                                                                               | 内容                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/globals.css`                                                                  | `@tailwind` 指令、shadcn 系 CSS 変数（`:root` / `.dark`）、`@apply` による base、`clickable-button`                                  |
| `src/app/page.module.css`                                                              | `@apply` によるレイアウト（`sm:` / `md:` のレスポンシブ指定を含む）                                                                  |
| `src/components/layout/Header.module.css`                                              | `@apply sm:top-8 sm:right-12`                                                                                                        |
| `src/app/layout.tsx` / `src/app/[lang]/layout.tsx`                                     | body の `bg-stone-50 text-stone-700` 等                                                                                              |
| `src/app/page.tsx` / `src/app/not-found.tsx`                                           | 移転案内ページ（各 9 箇所の `className`）                                                                                            |
| `src/app/[lang]/test/page.tsx`                                                         | **e2e テストページ**（41 箇所の `className`）                                                                                        |
| `src/components/layout/Header.tsx` / `Footer.tsx` / `LocaleSelector.tsx` / `Image.tsx` | レイアウト部品                                                                                                                       |
| `src/components/ui/button.tsx` / `select.tsx` / `separator.tsx`                        | shadcn/ui（`cva` + `cn` + Tailwind クラス）。`select` は `@radix-ui/react-select`、`separator` は `@radix-ui/react-separator` に依存 |
| `src/lib/utils.ts` / `src/lib/__tests__/utils.test.ts`                                 | shared の `cn()`（`tailwind-merge`）の再エクスポートとそのテスト                                                                     |

## 設計方針

### 1. 対応ブラウザ要件

v4 は Chrome 111+ / Safari 16.4+ / Firefox 128+ を要求する。extension は Chrome 拡張（Manifest V3）のため **要件上の問題はない**。manifest の `minimum_chrome_version` を設定している場合は 111 以上であることを確認する。hub は Tailwind を撤去するため本要件の対象外。

### 2. ビルド統合

- **extension**: `@tailwindcss/vite` を採用（公式推奨・高速）。`postcss.config.cjs` と `autoprefixer` を削除する。
  - crxjs / `vite-plugin-css-injected-by-js` / `removeCssFromContentScript` との併用で CSS 出力ファイル構成が変わらないかを確認する。問題があれば `@tailwindcss/postcss` にフォールバックする。
- **hub**: Tailwind / PostCSS 設定を削除する（7 章）。
- `tailwindcss` 本体の依存は root と hub から外し、extension の `devDependencies` にのみ明示する（現在 extension は root の hoist に依存している）。

### 3. extension の設定は CSS-first（`@theme`）へ移行する

`@config` で JS 設定を読み込み続ける方式も可能だが、v4 では非推奨寄りで、共通設定を spread する現在の構成は `@config` と相性が悪い。また hub が Tailwind を使わなくなるため、パッケージ間で Tailwind テーマを共有する必要もなくなる。そこで root の `tailwind.config.js` と extension の `tailwind.config.js` の内容を、extension のエントリ CSS（`global.css`、必要に応じて `theme.css` に分割）へ統合する。

- shadcn 系カラー: 既存の `hsl(var(--xxx))` 形式を維持し、`@theme inline { --color-border: hsl(var(--border)); ... }` で接続する（oklch への変換は本移行のスコープ外）。
- `--radius-lg/md/sm`、`--font-sans` を移植。
- `darkMode: ["class"]` → `@custom-variant dark (&:where(.dark, .dark *));`
- keyframes / animation（`--animate-*` + `@keyframes`）を移植。
- `listStyleType` は `@utility list-square` / `list-circle` 等で再定義。
- `fontSize` / `padding` / `translate` / `minWidth` の px 上書きは 4.2 の方針で置き換える。
- `container` 設定は `container` ユーティリティ未使用のため削除する。
- `tailwindcss-animate` → **`tw-animate-css`**（shadcn 公式の v4 向け後継）へ置き換え、CSS から `@import "tw-animate-css";` する。
- root / extension の `tailwind.config.js` は削除する。

### 4. ユーザーページとの相互不干渉（設計原則）

content script はユーザーが閲覧中の任意のページ（以下「ユーザーページ」）上で動作する。そのため、本移行では以下の 2 点を必須要件とする。

- **ユーザーページへ影響を与えない**: 拡張機能の CSS・CSS 変数・`@property` 登録などを Shadow root の外（`document` / `document.head`）へ一切出さない。
- **ユーザーページから影響を受けない**: ユーザーページの root font-size（`rem` の基準）や `@property` 登録などに、content script UI の見た目が左右されないようにする。

以下の 4.1 / 4.2 はこの原則に基づく設計である。

#### 4.1 Shadow DOM 内での `@property` 非対応への対策（最重要リスク）

content script の UI は Shadow DOM 内でスタイルを適用している。v4 は `shadow-*` / `ring-*` / `translate-*` / `scale-*` / `rotate-*` / グラデーション / `blur` などで `@property` による CSS 変数の初期値登録に依存しているが、**Chrome は Shadow root 内の `@property` を無視する**ため、これらのユーティリティが効かなくなる（既知の問題）。

**対策: 自前のビルドプラグインで初期値を Shadow root 内に閉じて付与する。**

- ビルド時に生成 CSS の `@property --tw-*` 定義から `initial-value` を抽出し、`:host, *, ::before, ::after, ::backdrop { --tw-xxx: <initial-value>; }` を `@layer base`（`@layer properties`）に付与する小さな PostCSS / Vite プラグインを作成する。
- 付与したルールは Shadow root に注入される CSS の中にのみ存在するため、ユーザーページへは影響しない。
- `@property` を `document.head` に注入する方式は、ユーザーページにグローバルな登録を残して影響を与えるため**採用しない**。逆に、ユーザーページ側が同名の `--tw-*` を `@property` 登録している場合（ユーザーページが Tailwind v4 製の場合など）でも、各要素に明示的に値を宣言するため初期値の差異の影響を受けない。
  - ただし `@property` の `syntax`（型）はユーザーページ側の登録が Shadow DOM 内にも適用される。Tailwind v4 同士であれば同一定義のため問題ないが、型の異なる同名登録がある場合の挙動を PoC で確認する。
- options page / onboarding page は拡張機能自身のページであり、`@property` が通常どおり機能するため本プラグインの付与は無害（同値の宣言が増えるのみ）。content script 用 CSS のみに適用するかは PoC で判断する。

また v4 の Preflight は `html, :host` を対象にするため、v3 より Shadow DOM との相性は改善する見込み。

#### 4.2 `rem` 依存の排除（px 化）

`rem` はドキュメントの root（`<html>`）の font-size を基準とするため、Shadow DOM 内でも**ユーザーページの root font-size の影響を受ける**。現状（v3）でも extension は `fontSize.xs/sm` と `padding` / `translate` / `minWidth` の一部を px で上書きしてこれを回避しているが、上書きしていないトークン（margin / gap / width、`text-base` 以上、`max-w-*` 等）は rem のままで、**既にユーザーページの影響を受けている**。

v4 ではスペーシングが `--spacing` を基準にした単一スケールになり、`padding` だけを上書きする手段がない。そこで本移行で、extension のテーマから rem 依存を排除する。

- `@theme { --spacing: 4px; }` とし、スペーシング系ユーティリティ（padding / margin / gap / width / height / inset / translate 等）をすべて px 基準にする。現在の px 上書き（`p-1 = 4px` 等）と同じ値になる。
- rem で定義されている v4 のデフォルトトークンを px で再定義する（16px = 1rem 換算で、標準環境での見た目は不変）。
  - `--text-*`（`xs: 12px` / `sm: 14px` / `base: 16px` / `lg` / `xl` / `2xl`〜`4xl` 等、使用中のもの以上）と対応する `--text-*--line-height`
  - `--container-*`（`max-w-lg` / `max-w-xl` / `max-w-2xl`〜`4xl` 等）
  - `--radius-*`（root の `--radius` は extension では既に `8px`）
  - `--tracking-*` は em 単位のため対象外。`--leading-*` は単位なしのため対象外。
  - `--breakpoint-*` はメディアクエリ内の rem がブラウザ既定値基準でありユーザーページの影響を受けないため対象外。
- 再定義漏れを防ぐため、ビルド後の content script 用 CSS に `rem` が残っていないことを確認するチェック（ビルドスクリプト or ユニットテスト）を追加する。arbitrary value（`w-[2rem]` 等）での rem 記述も禁止し、同チェックで検出する。
- v3 では `fontSize.xs/sm` が文字列指定のため line-height が付与されていなかったが、v4 では `--text-*--line-height` が付与される。差分が出る場合は `--text-xs--line-height` / `--text-sm--line-height` を調整する。
- options page / onboarding page も同じテーマを共有するが、root font-size は既定の 16px のため見た目は変わらない。

### 5. extension のデフォルトスタイル変更への対応

| 変更点                                   | 対応                                                                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| border の既定色が `currentColor` に      | 既存の `* { @apply border-border; }` があるため影響なし（維持する）                                                                          |
| `ring` の既定幅 3px→1px、既定色          | アップグレードツールで `ring` → `ring-3` に置換。既定色は shadcn の `ring-ring` 指定箇所が多いため個別確認                                   |
| placeholder 色                           | 現行の見た目を確認し、必要なら `@layer base` で `gray-400` 相当を指定                                                                        |
| `button` の `cursor: default`            | v3 と同様にするため `button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer; }` を base に追加                              |
| `hover:` が `@media (hover: hover)` 内に | 拡張機能はデスクトップ前提のため原則そのまま。e2e で hover 依存のテストが落ちる場合のみ `@custom-variant hover (&:hover);`                   |
| `hidden` 属性の優先度                    | `hidden` 属性と `flex` 等を併用している箇所がないか確認                                                                                      |
| `space-x/y-*` のセレクタ変更             | 36 箇所を目視確認。インライン要素や条件付きレンダリングの子でズレる場合は `flex` + `gap` に置換                                              |
| `transform` 系の個別プロパティ化         | `transition-[transform]` / `transform-none` の使用箇所を確認。`onboarding-float` は既に `translate` プロパティを使用しているため互換性は良い |

### 6. extension の CSS Modules / `@layer` の書き換え

- `@apply` を含む CSS Modules（8 ファイル）の先頭に `@reference "<entry css>";` を追加する。
- `global.css` の `@layer components` / `@layer utilities` 内の独自クラス（`marquee-var` / `animate-pause` / `transition-size`）を `@utility` に移行する。`@layer base` はそのまま利用可能。
- `@import "tailwindcss/base"` 等を `@import "tailwindcss";` に置換する。

### 7. hub からの Tailwind 撤去

hub は「テストページ」と「設定値（`ai-services.json` / `experiments.json`）のホスティング」のみを担うため、Tailwind・shadcn/ui をやめて素の CSS にする。見た目の厳密な再現は不要だが、**e2e テストページの DOM 構造は維持する**。

#### 7.1 スタイリング方針

- Next.js 組み込みの CSS サポート（グローバル CSS + CSS Modules）のみを使う。PostCSS プラグインは不要なため `postcss.config.mjs` を削除する（Next.js のデフォルト設定に戻る）。CSS のネスト（`common.module.css` の `&:hover`）はブラウザのネイティブ CSS Nesting で動作する。
- `globals.css`: `@tailwind` 指令と `@apply` を削除し、必要最小限のリセット（`box-sizing`、`margin: 0` 等）と body の配色・フォントを素の CSS で記述する。shadcn 系 CSS 変数のうち使用するもの（`--border` 等）のみ残し、`.dark` / `--chart-*` / `clickable-button` は削除する。
- `page.module.css` / `Header.module.css`: `@apply` を素の CSS に展開する。`sm:` / `md:` は `@media (min-width: 640px)` / `(min-width: 768px)` に置き換える。
- 各コンポーネントの `className` に書かれた Tailwind クラスは、コンポーネントごとの CSS Modules に移す。対象: `layout.tsx`、`[lang]/layout.tsx`、`page.tsx`、`not-found.tsx`、`[lang]/test/page.tsx`、`Header.tsx`、`Footer.tsx`、`LocaleSelector.tsx`、`Image.tsx`。
  - `page.tsx` と `not-found.tsx` は同じ移転案内のマークアップのため、CSS Modules を共有する。
  - `Image.tsx` の `dark:invert` は `.dark` クラスを付与する仕組みが hub にないため削除する。

#### 7.2 shadcn/ui コンポーネントの置き換え

| コンポーネント                     | 置き換え                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/button.tsx`                    | テストページでのみ使用。素の `<button>` + CSS Modules に置き換え、ファイルを削除                                                         |
| `ui/separator.tsx`                 | Footer でのみ使用。`<hr>` + CSS に置き換え、ファイルと `@radix-ui/react-separator` を削除                                                |
| `ui/select.tsx` + `LocaleSelector` | ネイティブの `<select>` + CSS Modules に置き換え、ファイルと `@radix-ui/react-select` を削除。言語切り替えの挙動（`switchLocale`）は維持 |

#### 7.3 削除する依存・ファイル

- 依存（hub）: `tailwindcss` / `postcss` / `tailwindcss-animate` / `tailwind-merge` / `class-variance-authority` / `@radix-ui/react-select` / `@radix-ui/react-separator`
  - `clsx` は複数クラスの結合が必要な箇所で使う場合のみ残す。`lucide-react` はアイコンとして引き続き使用する。
- ファイル: `tailwind.config.ts`、`postcss.config.mjs`、`components.json`、`src/components/ui/*`
- `src/lib/utils.ts` の `cn` の再エクスポートと、`src/lib/__tests__/utils.test.ts` の `cn` のテストを削除（`cn` は shared に残り、extension が引き続き使用する）
- `vitest.config.ts` のカバレッジ除外設定から `tailwind.config.ts` 等を削除
- `packages/hub/AGENTS.md` / ルートの `AGENTS.md` に Tailwind・shadcn/ui に関する記述があれば更新し、「hub では Tailwind を使用しない」旨を明記する

#### 7.4 e2e テストページへの影響

Extension の Playwright e2e テストは、**GitHub Pages にデプロイされたテストページ**（`packages/extension/e2e/pages/TestPage.ts` の `TEST_URL`）にアクセスする。そのため以下を守る。

- テキスト選択の対象（`h1, h2, h3`）、`data-testid`、`input` の `placeholder`、`textarea`、ボタンの文言など、**e2e が参照する要素・属性・テキストは変更しない**。変更するのはスタイリング（`className`）のみとする。
- `menu-layout.spec.ts` はメニューボタンの `boundingBox` を検証しているため、見出しの位置・サイズなどテストページのレイアウトは大きく変えない。
- PR の CI で実行される e2e は、まだデプロイされていない旧テストページに対して実行される。そのため PR 内では、hub をローカルでビルド・配信し、その URL に対して e2e を実行して確認する（`E2E_HUB_BASE_URL` を指定すると、`ujiro99.github.io` へのリクエストをローカルの hub へ転送する e2e ヘルパー `e2e/utils/hubRoute.ts` を追加する。テスト設定データにも同 URL が散在しているため、URL を個別に差し替えるのではなく転送方式とした）。
- マージ後に GitHub Pages へのデプロイが完了してから、main で e2e が通ることを確認する。

### 8. 関連ライブラリ

- `tailwind-merge` を **v3** へ更新（v3 が Tailwind v4 対応版。v2 は v4 の新クラス名を正しく扱えない）。shared / extension で揃える（hub からは削除）。
- `class-variance-authority` は extension では変更不要（hub からは削除）。
- extension の shadcn/ui コンポーネント（`components/ui/*`）はアップグレードツールでクラス名を置換したうえで、必要に応じて shadcn の v4 版と差分比較する（`forwardRef` の削除等の React 19 対応は本移行のスコープ外）。

## 作業手順

1 つの PR（ブランチ `feat/tailwindcss-v4`）で行う。レビューしやすいよう、以下の Phase ごとにコミットを分け、各コミットでビルドが通る状態を保つ。

### Phase 0: 準備・PoC

1. 現行（v3）の主要画面のスクリーンショットを取得し、比較基準とする（下記「検証」参照）。
2. extension で `@tailwindcss/vite` を導入した最小構成を作り、以下を確認する。
   - crxjs ビルドで content script 用 CSS が manifest から除去され、Shadow root へ注入される流れが維持されるか
   - dev モード（`vite-plugin-css-injected-by-js`）で HMR が機能するか
   - Shadow DOM 内で `shadow-*` / `ring-*` / `translate-*` が効かない問題の再現と、自前プラグイン（4.1）の有効性
   - ユーザーページ側に同名の `@property` 登録がある場合の挙動

### Phase 1: hub から Tailwind を撤去

extension の移行と独立して実施できるため先に行う。hub が root の `tailwind.config.js` を参照しなくなることで、Phase 2 で root の設定を extension へ統合できる。

1. 各コンポーネントの Tailwind クラスを CSS Modules / `globals.css` に移す（7.1）。
2. shadcn/ui コンポーネントを置き換える（7.2）。
3. 依存・設定ファイルを削除する（7.3）。
4. `E2E_HUB_BASE_URL` によるローカル hub への転送を追加し、ローカル配信したテストページで e2e を実行する（7.4）。

### Phase 2: extension の依存とビルド設定の更新

1. Node.js 20+ 環境で `npx @tailwindcss/upgrade` を extension に対して実行する。共通設定を spread する構成のため、ツールが自動変換に失敗する場合は手動移行に切り替える。
2. `tailwindcss@^4` / `@tailwindcss/vite` / `tw-animate-css` / `tailwind-merge@^3`（shared / extension）を導入し、`autoprefixer` / `tailwindcss-animate` / root の `tailwindcss` / `postcss` を削除する。
3. `postcss.config.cjs` を削除し、`vite.config.ts` に `tailwindcss()` プラグインを追加する。

### Phase 3: extension のテーマ・CSS の移行

1. root / extension の `tailwind.config.js` の内容を extension のエントリ CSS へ統合する（3 章）。
2. `global.css` を v4 形式に書き換える（`@import "tailwindcss"`、`@theme`、`@custom-variant dark`、`@utility`、base スタイル補正）。
3. CSS Modules に `@reference` を追加する。
4. Shadow DOM 用 `@property` フォールバックプラグイン（4.1）を追加する。
5. rem トークンを px で再定義し（4.2）、content script 用 CSS に `rem` が残らないことのチェックを追加する。
6. root / extension の `tailwind.config.js` を削除し、参照箇所（`eslint` 設定等）を更新する。

### Phase 4: extension のクラス名の置換と目視修正

1. アップグレードツールによるリネーム差分（`shadow` / `rounded` / `blur` / `outline-none` / `ring` / `flex-shrink` / `bg-gradient-to-*` 等）をレビュー。
2. `cn()` / `cva()` 内の文字列やテンプレートリテラルなど、ツールが拾えない箇所を grep で補完。
3. `space-x/y-*`、placeholder、button cursor、ring の見た目差分を修正。

### Phase 5: 検証・リリース

下記「検証」を実施し、問題なければ main へマージする。マージ後、hub の GitHub Pages デプロイ完了を待って main の e2e を確認する。拡張機能はストア審査を経るため、マイナーバージョンとしてリリースし、Sentry で CSS 起因のエラーやユーザー報告を監視する。

## 検証

### 自動テスト

- `yarn lint` / `yarn test`（extension でクラス名を検証するユニットテストが 5 ファイル程度あるため、リネームに追随させる）
- `yarn build`（全パッケージ）、`yarn build:e2e` + `yarn test:e2e`
  - PR 内ではローカル配信した新テストページに対して実行する（7.4）
- hub: `yarn build:hub` で静的出力（`/en/test` ページ、`ai-services.json`、`experiments.json`）が従来通り生成されること
- hub: ビルド成果物（`out/`）の CSS に Tailwind 由来のルールが含まれないこと、`package.json` に Tailwind 関連の依存が残っていないこと

### 目視確認（v3 時点のスクリーンショットと比較）

- **content script（Shadow DOM）**: 選択時ポップアップメニュー、コマンド実行結果ポップアップ、PageAction レコーダー、リンクプレビュー、各種アニメーション（`popup`、`marquee`、`spin-slow`）
  - 通常ページに加え、**root font-size が 16px でないユーザーページ**（例: `html { font-size: 62.5% }`）で UI が変化しないこと、**Tailwind v3/v4 製のユーザーページ**で相互に干渉しないこと、content script 起動前後でユーザーページの見た目が変わらないことを確認
- **options page**: 各セクション、コマンド編集ダイアログ、ショートカット一覧、目次、ヘルプ、HubBanner、ダークモード
- **onboarding page**: variant A/B/C の各画面と `onboarding-*` アニメーション（blur / glow / ring / float / pop）
- **hub**: `/en/test` ページ（レイアウトが大きく崩れていないこと、言語切り替えが動作すること）、ルートの移転案内ページ、404 ページ

### 確認観点

- shadow / ring / focus-visible リング / transform / グラデーション / blur が Shadow DOM 内で効いているか
- フォーカスリングの太さ・色、角丸、影の強さが v3 と同等か
- `space-x/y-*` を使う箇所のレイアウト崩れ
- ボタンのカーソル、placeholder の色
- 生成 CSS のサイズ（content script の注入コストに影響するため v3 と比較）

## 実装メモ（計画からの差分・判明事項）

実装時に判明し、計画から変更・追加した点。

- **アップグレードツールの誤変換**: `npx @tailwindcss/upgrade` は TypeScript の文字列リテラル型 `"blur"`（`OnboardingFadeIn` の `FadeInEffect`）を `"blur-sm"` に書き換えたため元に戻した。また shadcn の v4 版で既に `shadow-xs` を使っていた `radio-group` を `shadow-2xs` に変換したため `shadow-xs` に戻した。CSS Modules 内の `@apply` は変換されないため手動で置換した。依存の追加はツール内の `yarn add` が workspace 構成で失敗したため手動で行った。
- **素の `rounded`**: v4 でも `rounded` は `0.25rem` 固定の組み込みユーティリティとして残り、`@utility` では上書きできない。アップグレードガイドどおり `rounded` → `rounded-sm`（テーマ上 4px）に置換した。
- **`App.css` の `@import url(...)`**: `url()` 形式の import では Tailwind が `global.css` を処理せず、`@theme default` が未処理のまま出力された。`@import "./global.css"` に変更した。
- **未使用の `container` ユーティリティ**: ソース中の単語 "container"（`css.container` 等）から rem 定義の `container` が生成されていた（v3 でも同様）。`@source not inline("container")` で生成対象から除外した。
- **`text-xs` / `text-sm` の line-height**: v3 と同じく line-height を付与しないよう、`--text-xs--line-height: initial` 等で無効化した。
- **content script 内の既存の rem**: `Popup.module.css` の `1.2rem` / `0.8rem`、`text-[0.8rem]` を px に置き換えた（v3 時代からユーザーページの影響を受けていた箇所）。options page 専用の CSS Modules の rem はユーザーページの影響を受けないため対象外とした。
- **`--font-sans`**: v3 の設定は未定義の `var(--font-sans)` を参照しており実質無効だったため、v4 既定のシステムフォントスタックに戻した。content script の各コンテナは `--font-family` で独自にフォントを指定しているため見た目は変わらない。
- **`@layer properties`**: Tailwind v4 の出力は先頭で `@layer properties;` を宣言するため、Shadow DOM 用プラグインが末尾に追加する初期値は最も優先度の低いレイヤーに入る。
- **hub テストページの縦方向の余白**: flex の `gap` にすると Quill の `.ql-container { height: 100% }` が親からはみ出したため、v3 の `space-y-*` と同じく兄弟要素間のマージンで実装した。
- **CSS サイズ**: content script に注入される CSS は約 65KB → 約 85KB（v4 はテーマ変数と `@property`、互換用の初期値ブロックを含むため）。
- **`cn()` のテスト**: tailwind-merge v3 の v4 クラス名の扱いを `src/lib/__tests__/utils.cn.test.ts` で確認するようにした。

## リスクと対策

| リスク                                         | 影響                                                                      | 対策                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Shadow DOM 内で `@property` が無効             | content script UI の影・リング・transform が崩れる                        | Phase 0 で PoC、Shadow root 内に閉じた自前プラグインで初期値を付与（4.1）                         |
| crxjs と `@tailwindcss/vite` の相性            | CSS が manifest に混入しユーザーページを破壊 / Shadow root に注入されない | Phase 0 で dist の manifest と CSS ファイルを確認。問題があれば `@tailwindcss/postcss` に切り替え |
| 共通設定 spread 構成をツールが変換できない     | 手作業が増える                                                            | extension のエントリ CSS へ手動統合する前提で計画                                                 |
| rem トークンの px 再定義漏れ                   | ユーザーページの root font-size により UI サイズが変わる                  | ビルド後 CSS の `rem` 残存チェック（4.2）と目視確認                                               |
| `tailwind-merge` v3 の挙動差                   | `cn()` の結合結果が変わる                                                 | shared の `cn` のユニットテストを追加・確認                                                       |
| v4 の Cascade Layers と非 layer CSS の優先度差 | options/onboarding ページで非 layer の CSS が Tailwind より優先される     | `App.css` / `Animation.css` / `OpenInTab.css` 等の非 layer CSS との競合を目視確認                 |
| hub テストページの DOM / レイアウト変化        | デプロイ後に e2e（特に `menu-layout.spec.ts`）が失敗する                  | スタイリングのみ変更し DOM は維持。PR 内でローカル配信したテストページに対して e2e を実行（7.4）  |
| PR の CI の e2e が旧テストページで実行される   | hub 変更起因の問題を CI で検出できない                                    | ローカルでの e2e 実行を必須とし、マージ・デプロイ後に main の e2e を確認                          |

## 判断が必要な事項

1. カラートークンの **oklch 化**や extension の shadcn/ui コンポーネントの最新化は別 Issue とする（本移行は見た目を変えないことを優先）。

※ 以下は決定済み。

- Shadow DOM 対策の方式（自前ビルドプラグイン）と rem 依存の排除（px 化）: 「ユーザーページとの相互不干渉」の原則（4章）による
- hub: Tailwind を v4 へ移行せず撤去し、extension の移行と同じ PR で行う（7章）
