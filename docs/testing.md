# テスト設計・運用ポリシー

## 概要

本プロジェクトでは以下の 2 層のテスト戦略を採用。各層は役割と対象が明確に分かれており、品質担保の異なる側面をカバー。

```
  ┌──────────────────┐
  │  E2E Test        │  ← ユーザーフロー全体 (Playwright)
  ├──────────────────┤
  │  Unit Test       │  ← ロジック・コンポーネント単体 (Vitest)
  └──────────────────┘
```

| パッケージ           | Unit Test | E2E Test |
| -------------------- | --------- | -------- |
| `packages/extension` | ◯         | ◯        |
| `packages/hub`       | ◯         | -        |
| `packages/shared`    | -         | -        |

---

## 1. Unit Test (Vitest)

### 目的

- サービス・ユーティリティ関数の正確性を保証
- React コンポーネント・フックの描画・振る舞いを検証
- 変更の影響範囲を即座に検知

### 対象

| 種別           | 対象                    | 例                                           |
| -------------- | ----------------------- | -------------------------------------------- |
| サービス       | `src/services/`         | 設定管理、ストレージ、ページアクション処理   |
| アクション     | `src/action/`           | コマンド実行、AIプロンプト、リンクプレビュー |
| ユーティリティ | `src/lib/`              | `cn()`、Robula+ などのヘルパー               |
| フック         | `src/hooks/`            | `useSettings` などのカスタムフック           |
| コンポーネント | `src/components/`       | メニュー、オプション画面、オンボーディング   |
| Service Worker | `src/service_worker.ts` | Service Worker のメッセージハンドリング      |

### ファイル配置

テストファイルは、テスト対象ファイルと同じ階層の `__tests__` ディレクトリに配置。

```
src/
  components/
    menu/
      MenuItem.tsx
      __tests__/
        MenuItem.test.tsx      ← ここに配置
  services/
    settings/
      settings.ts
      __tests__/
        settings.test.ts       ← ここに配置
  test/
    setup.ts                   ← グローバルセットアップ（共通設定）
    __mocks__/                 ← モジュールエイリアス用のモック
```

- ファイル名は `<テスト対象ファイル名>.test.ts(x)` とする
- 1 ファイルが大きくなる場合は観点ごとに分割してよい（例: `CommandList.analytics.test.tsx`、`serviceWorker-crud.test.ts`）
- テスト対象モジュールは相対パス（`../settings`）または `@/` エイリアスで import する

### テストケースの命名規則

- **接頭辞**: `機能名の略称 + 通し番号` を使用
  - 後から追加した場合は記号を付けて区別（例: `SU-01-a`）
- **形式**: `接頭辞: 正常系/異常系: 期待される動作`
- **例**: `SU-01: 正常系: 基本的な使用量計算が正しく行われる`
- 既存テストで英語表記（例: `CM-12: should handle non-existent parent folder references`）を用いているファイルは、そのファイル内の表記に合わせる

### テスト設計のガイドライン

- **Arrange-Act-Assert (AAA)** パターンを使用
- 正常系・異常系・境界値テストを含める
- テスト間の副作用を最小限に抑えるため、モックの使用は最低限にする
- `beforeEach` で `vi.clearAllMocks()` 等を行い、テスト間で状態を持ち越さない
- 共通的なモック（Chrome Extension API など）は `src/test/setup.ts` に配置

### 方針

- **テスト対象**: 関数の入出力、コンポーネントの描画内容、エラーハンドリング
- **テスト対象外**: 実ブラウザ上でのウィンドウ/タブ操作、外部サイトとの連携（E2E に委ねる）
- **モック**:
  - Chrome Extension API（`chrome.*`）は `src/test/setup.ts` でグローバルにモック
  - 外部依存（Sentry、Analytics 等）は `vi.mock()` でモックする
  - テスト対象モジュール内部のロジックは原則モックしない
- **カバレッジ**: `yarn test:coverage` で計測。サービス層・ユーティリティは高いカバレッジを維持する

### 実行コマンド

```bash
# ルートから
yarn test                  # 全パッケージのテスト実行（CI 向け）
yarn test:coverage         # カバレッジ計測

# packages/extension 内で
yarn test                  # ウォッチモード（開発中）
yarn test:run              # 1 回実行
yarn test:ui               # UI モード
yarn test src/services/settings/__tests__/settings.test.ts   # 単一ファイル実行
```

### 設定ファイル

- `vitest.config.ts`（ルート） — 共通設定（jsdom 環境、globals、カバレッジ）
- `packages/*/vitest.config.ts` — パッケージ固有設定（エイリアス、setupFiles）
- `packages/*/src/test/setup.ts` — グローバルセットアップ（`@testing-library/jest-dom` の初期化、Chrome API モック）

---

## 2. E2E Test (Playwright)

### 目的

- 実際のブラウザに拡張機能を読み込み、ユーザーが体験するフロー全体を保証
- クリティカルなユーザージャーニーの回帰テスト

### 対象

テスト項目の一覧と実装状況は [E2Eテスト仕様書](./test/e2e-test-spec.md) で管理する。

| 優先度 | シナリオ例                                 |
| ------ | ------------------------------------------ |
| 高     | 起動方法（テキスト選択・キー入力・長押し） |
| 高     | 検索コマンドの実行（OpenMode ごと）        |
| 中     | 設定画面での編集・インポート/エクスポート  |
| 中     | ページアクションの記録・再生               |
| 低     | メニューレイアウト・ユーザースタイル       |

### ファイル配置

```
packages/extension/
  e2e/
    search-command.spec.ts    ← シナリオごとの spec
    settings.spec.ts
    fixtures.ts               ← 拡張機能を読み込むカスタム fixture
    const.ts
    data/                     ← テストデータ
    pages/                    ← Page Object Model
      OptionsPage.ts
      TestPage.ts
    utils/                    ← 共通ユーティリティ
```

### テスト設計のガイドライン

- **Arrange-Act-Assert (AAA)** パターンを使用
- **Page Object Model (POM)** パターンで頻出する操作を抽象化
  - ページオブジェクトは `e2e/pages/` に配置
- テスト ID は `E2E-XX` 形式とし、[E2Eテスト仕様書](./test/e2e-test-spec.md) を追加・更新すること

### 方針

- **テスト対象**: クリティカルパスのみに絞る（全画面を網羅しない）
- **テストページ**: `packages/hub` がデプロイする `/en/test` ページを利用する
- **フレーキー対策**: `page.waitForSelector` より `expect(locator).toBeVisible()` を優先
- **並列実行**: `launchPersistentContext` の競合を避けるため `workers: 1` で実行
- **スクリーンショット**: 失敗時のみ取得（`only-on-failure`）

### 実行コマンド

```bash
# packages/extension 内で
yarn build:e2e             # E2E 用ビルド（実行前に必ず実施）
yarn test:e2e              # E2E テスト実行
```

### 設定ファイル

- `packages/extension/playwright.config.ts` — テストディレクトリ・リトライ・ワーカー数の設定
- `packages/extension/.env.e2e` — E2E 用の環境変数（任意。存在する場合に `dotenv` で読み込まれる）
