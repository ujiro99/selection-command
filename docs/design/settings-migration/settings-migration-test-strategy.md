# Settings.get 移行テスト戦略

## テスト戦略概要

`Settings.get()` から `EnhancedSettings.get()` への移行を安全に実行するための包括的なテスト戦略を定義する。

## 既存テスト基盤の分析

### 現在のテストファイル構成

```
src/services/settings/
├── settings.test.ts              # Settings クラスのユニットテスト
├── enhancedSettings.test.ts      # EnhancedSettings クラスのユニットテスト
└── settingsCache.test.ts         # settingsCache のユニットテスト

src/hooks/
└── useSettings.test.tsx          # useSettings フックのテスト（既にenhancedSettings使用）

src/test/
└── setup.ts                     # Vitestセットアップ（Chrome API モック含む）
```

### 既存テストの特徴

- **Vitest** を使用した単体テスト
- **Chrome拡張機能API** のモック環境
- **jsdom** 環境での DOM 操作テスト
- **React Testing Library** による Hooks テスト

## 移行テスト計画

### 移行テスト

#### MG-01: background_script.ts 移行テスト

**テストファイル**: 既存の`src/background_script.test.ts`を拡張

```typescript
// background_script.ts の各関数でenhancedSettings.get()が使用されることを確認
describe("Background Script Migration", () => {
  it("MG-01-a: addPageRule関数でenhancedSettings.get()が呼ばれる", async () => {
    const spy = jest.spyOn(enhancedSettings, "get")
    // テスト実装...
    expect(spy).toHaveBeenCalled()
  })

  it("MG-01-b: executeCommand関数での設定取得", async () => {
    // 同様のテスト...
  })

  it("MG-01-c: toggleStar関数での設定取得", async () => {
    // 同様のテスト...
  })

  it("MG-01-d: onCommand関数での設定取得", async () => {
    // 同様のテスト...
  })
})
```

#### MG-02: サービス層移行テスト

**テストファイル**: 既存の各サービステストファイルを拡張

```typescript
// 各サービスでenhancedSettings.get()が使用されることを確認
describe("Service Layer Migration", () => {
  it("MG-02-a: commandMetricsでenhancedSettings.get()を使用", async () => {
    const spy = jest.spyOn(enhancedSettings, "get")
    // テスト実装...
    expect(spy).toHaveBeenCalled()
  })

  it("MG-02-b: contextMenusでenhancedSettings.get()を使用", async () => {
    const spy = jest.spyOn(enhancedSettings, "get")
    // テスト実装...
    expect(spy).toHaveBeenCalled()
  })
})
```

## パフォーマンステスト

### MG-PERF-01: 取得時間測定テスト

既存の`enhancedSettings.test.ts`にはパフォーマンステストが存在しないため、以下を追加：

```typescript
describe("Performance Tests", () => {
  it("MG-PERF-01: 初回取得時間の測定", async () => {
    const startTime = performance.now()
    await enhancedSettings.get()
    const duration = performance.now() - startTime

    // 取得時間が合理的な範囲内であることを確認（例: 100ms以下）
    expect(duration).toBeLessThan(100)
  })

  it("MG-PERF-02: キャッシュ効果の測定", async () => {
    // 初回取得
    const start1 = performance.now()
    await enhancedSettings.get()
    const duration1 = performance.now() - start1

    // 2回目取得（キャッシュから）
    const start2 = performance.now()
    await enhancedSettings.get()
    const duration2 = performance.now() - start2

    // 2回目の方が高速であることを確認
    expect(duration2).toBeLessThan(duration1 * 0.8) // 20%以上高速化
  })
})
```

## E2E テスト（手動）

### 拡張機能統合テスト

#### MG-E2E-01: 基本機能確認

1. **拡張機能読み込み**: Chrome://extensions/ でのリロード
2. **オプションページ**: 設定画面の正常表示
3. **コマンド実行**: テキスト選択→コマンド実行
4. **コンテキストメニュー**: 右クリックメニューの表示
5. **ページルール**: URL別設定の適用確認

#### MG-E2E-02: エラー状況での動作確認

1. **ネットワークエラー**: オフライン状態での動作
2. **ストレージエラー**: Chrome storage の制限状況

## テスト実行環境

### CI/CD 環境での自動テスト

既存の`.github/workflows/test.yml`を使用。移行固有のテストも全体テストスイートの一部として実行される。

### ローカル開発環境でのテスト

```bash
# 移行テスト専用の実行
yarn test --testNamePattern="MG-"

# パフォーマンステスト実行
yarn test performance.test.ts

# 統合テスト実行
yarn test integration.test.ts

# 全テスト + カバレッジ
yarn test:coverage
```

## テスト品質基準

- **機能テスト**: 全てのMG-\*テストケースが成功
- **既存テスト**: 全ての既存テストが引き続き成功
- **ビルド**: TypeScriptビルドとlintチェックが成功

## 成功基準

1. **全テストパス**: 既存テスト + 移行テストが100%成功
2. **機能維持**: 拡張機能の全機能が正常動作
3. **ビルド成功**: TypeScript・lint・ビルドエラー 0件

移行は既存のCI/CDパイプラインとテストスイートを活用し、安全かつ確実に実行する。
