# Selection Command Hub - Vitestユニットテスト導入計画

## 概要

本ドキュメントは、Selection Command Hub（Next.js 15アプリケーション）へのVitestユニットテスト導入に関する包括的な計画書です。段階的なアプローチにより、品質向上と開発効率化を実現します。

## 現状分析

### 技術構成

- **フレームワーク**: Next.js 15 with App Router
- **React**: React 19 RC
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **フォーム**: react-hook-form + zod
- **国際化**: カスタム実装（11言語対応）

### 主要なテスト対象

#### 1. Pure Functions (`src/lib/utils.ts`)

- `cn()` - classname結合
- `generateUUIDFromObject()` - オブジェクトからUUID生成
- `isEmpty()` - 空判定
- `capitalize()` - 文字列の先頭大文字化
- `sleep()` - 非同期待機
- `sortUrlsByDomain()` - ドメイン別URL並び替え
- `isSearchCommand()`, `isPageActionCommand()` - コマンド種別判定

#### 2. ビジネスロジック (`src/features/`)

- `command.ts`
  - `getCommands()` - コマンド取得とフィルタリング
  - `getSearchUrl()` - 検索URL生成
  - `cmd2text()`, `cmd2uuid()` - データ変換
- `tag.ts` - タグ関連機能

## 段階的導入計画

### Phase 1: 基盤構築 (1-2週間)

#### 目標

テスト環境の構築とPure Functionsのテスト実装

#### 作業内容

1. **Vitest環境構築**

   ```bash
   # 依存関係インストール
   yarn add -D vitest @vitejs/plugin-react jsdom
   yarn add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
   yarn add -D @vitest/coverage-v8 @vitest/ui
   ```

2. **設定ファイル作成**
   - `vitest.config.ts` - Vitest設定
   - `src/test/setup.ts` - テスト環境セットアップ
   - `package.json` - テストスクリプト追加

3. **Pure Functions テスト実装**
   - `src/lib/utils.test.ts` - 全ユーティリティ関数のテスト
   - カバレッジ目標: 90%以上

#### 期待成果

- ✅ テスト実行環境の完成
- ✅ 15-20個のユーティリティ関数のテスト完了
- ✅ CI/CDパイプラインでのテスト実行

#### テストケース例

```typescript
describe("ユーティリティ関数", () => {
  test("UTIL-01: cn関数でclassnameが正しく結合される", () => {
    expect(cn("class1", "class2")).toBe("class1 class2")
  })

  test("UTIL-02: isEmpty関数で空文字列がtrueを返す", () => {
    expect(isEmpty("")).toBe(true)
  })
})
```

### Phase 2: ビジネスロジック (2-3週間)

#### 目標

コアビジネスロジックの網羅的テスト実装

#### 作業内容

1. **コマンド機能テスト**
   - `src/features/command.test.ts`
   - フィルタリング、検索、データ変換のテスト
   - Edge caseの網羅

2. **タグ機能テスト**
   - `src/features/tag.test.ts`
   - タグ統計、カテゴライズのテスト

#### 期待成果

- ✅ ビジネスロジックのカバレッジ80%以上
- ✅ 多言語機能の動作保証
- ✅ データ変換処理の正確性確保

#### テストケース例

```typescript
describe("コマンド操作機能", () => {
  test("CH-01: getCommands関数で正しくフィルタリングされる", () => {
    const result = getCommands({ tag: "Search", locale: "ja" })
    expect(result).toHaveLength(expectedLength)
  })

  test("CH-02: 無効なコマンドIDでgetSearchUrlがnullを返す", () => {
    expect(getSearchUrl("invalid-id")).toBeNull()
  })
})
```

## 技術仕様

### 必要な依存関係

```json
{
  "devDependencies": {
    "vitest": "^3.2.4",
    "@vitejs/plugin-react": "^4.3.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.6.0",
    "@vitest/coverage-v8": "3.2.4",
    "@vitest/ui": "^3.2.4",
    "jsdom": "^26.1.0"
  }
}
```

## テスト設計ガイドライン

### 命名規則

```typescript
describe("機能名", () => {
  // 正常系
  test("PREFIX-01: 正常系: 期待される動作の説明", () => {})

  // 異常系
  test("PREFIX-02: 異常系: エラーケースの説明", () => {})

  // 境界値
  test("PREFIX-03: 境界値: 境界条件の説明", () => {})
})
```

### プレフィックス分類

- **UTIL-**: ユーティリティ関数
- **CH-**: Command Hub関連ビジネスロジック
- **HOOK-**: カスタムhooks
- **UI-**: UIコンポーネント
- **FORM-**: フォーム関連
- **I18N-**: 国際化機能

### テストケース設計指針

#### 1. Arrange-Act-Assert パターン

```typescript
test("UTIL-01: cn関数でクラス名が正しく結合される", () => {
  // Arrange: テストデータの準備
  const class1 = "btn"
  const class2 = "btn-primary"

  // Act: 実行
  const result = cn(class1, class2)

  // Assert: 検証
  expect(result).toBe("btn btn-primary")
})
```

#### 2. Edge Case の網羅

- 空値、null、undefined
- 境界値（最小、最大）
- 無効な入力値
- 非同期処理のタイムアウト

## CI/CD 統合

### GitHub Actions 設定例

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"
      - run: yarn install --frozen-lockfile
      - run: yarn test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
```
