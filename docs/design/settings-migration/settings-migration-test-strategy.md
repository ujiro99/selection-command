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

### Phase 1: 後方互換性テスト

#### MG-P1-01: EnhancedSettings.get() オーバーロードテスト

**テストファイル**: `src/services/settings/enhancedSettings.test.ts`

```typescript
describe("EnhancedSettings Migration Compatibility", () => {
  describe("get() method overloads", () => {
    it("MG-P1-01-a: boolean引数での呼び出し（レガシー互換性）", async () => {
      const result = await enhancedSettings.get(true)
      expect(result).toBeInstanceOf(Object)
      expect(result.commands).toBeDefined()
      expect(result.folders).toBeDefined()
      // excludeOptions=true の場合、OptionSettings由来のコマンドが含まれない
      const optionCommands = result.commands.filter(
        (c) => c.parentFolderId === OPTION_FOLDER,
      )
      expect(optionCommands).toHaveLength(0)
    })

    it("MG-P1-01-b: オブジェクト引数での呼び出し（新インターフェース）", async () => {
      const result = await enhancedSettings.get({ excludeOptions: true })
      expect(result).toBeInstanceOf(Object)
      // 上記と同じ結果が得られることを確認
    })

    it("MG-P1-01-c: 引数なしでの呼び出し", async () => {
      const result = await enhancedSettings.get()
      expect(result).toBeInstanceOf(Object)
      // デフォルトでexcludeOptions=falseの動作確認
      const optionCommands = result.commands.filter(
        (c) => c.parentFolderId === OPTION_FOLDER,
      )
      expect(optionCommands.length).toBeGreaterThan(0)
    })
  })
})
```

#### MG-P1-02: Settings.get() 警告ログテスト

**テストファイル**: `src/services/settings/settings.test.ts`

```typescript
describe("Settings.get() deprecation warnings", () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "warn").mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it("MG-P1-02: Settings.get()呼び出し時に警告ログが出力される", async () => {
    await Settings.get()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[DEPRECATED] Settings.get() is deprecated"),
    )
  })
})
```

### Phase 2: 段階的移行テスト

#### MG-P2-01: background_script.ts 移行テスト

**テストファイル**: `src/services/settings/migration.integration.test.ts` (新規作成)

```typescript
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import type { SettingsType } from "@/types"

// background_script.ts の各関数を単体でテスト
describe("Background Script Migration Tests", () => {
  beforeEach(() => {
    // Chrome API モックのセットアップ
    jest.clearAllMocks()
  })

  it("MG-P2-01-a: addPageRule関数でenhancedSettings.get()が呼ばれる", async () => {
    const mockSettings: SettingsType = {
      pageRules: [],
      // その他必要なプロパティ...
    }

    const spy = jest
      .spyOn(enhancedSettings, "get")
      .mockResolvedValue(mockSettings)

    // addPageRule の実行
    // (実際のテストではbackground_script.tsから関数をエクスポートする必要がある)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("MG-P2-01-b: executeCommand関数での設定取得", async () => {
    // 同様のテスト...
  })

  it("MG-P2-01-c: toggleStar関数での設定取得", async () => {
    // 同様のテスト...
  })

  it("MG-P2-01-d: onCommand関数での設定取得", async () => {
    // 同様のテスト...
  })
})
```

#### MG-P2-02: サービス層移行テスト

**テストファイル**: `src/services/commandMetrics.test.ts`, `src/services/contextMenus.test.ts`

```typescript
// commandMetrics.test.ts
describe("CommandMetrics Migration", () => {
  it("MG-P2-02-a: incrementCommandExecutionCount でenhancedSettings.get()を使用", async () => {
    const spy = jest.spyOn(enhancedSettings, "get").mockResolvedValue({
      commandExecutionCount: 5,
      hasShownReviewRequest: false,
    } as SettingsType)

    await incrementCommandExecutionCount(123)

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

// contextMenus.test.ts
describe("ContextMenus Migration", () => {
  it("MG-P2-02-b: ContextMenu.init でenhancedSettings.get()を使用", async () => {
    const mockSettings: SettingsType = {
      startupMethod: { method: STARTUP_METHOD.CONTEXT_MENU },
      // その他のプロパティ...
    }

    const spy = jest
      .spyOn(enhancedSettings, "get")
      .mockResolvedValue(mockSettings)

    ContextMenu.init()

    // 非同期処理の完了を待つ
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
```

### Phase 3: 完全移行テスト

#### MG-P3-01: Settings.get() 削除後テスト

**テストファイル**: `src/services/settings/settings.test.ts`

```typescript
describe("Settings after get() removal", () => {
  it("MG-P3-01: Settings.get メソッドが存在しない", () => {
    expect(Settings.get).toBeUndefined()
  })

  it("MG-P3-02: 他のSettingsメソッドは正常動作", async () => {
    // set, update, addCommands などのテスト
    const testData: SettingsType = {
      // テストデータ...
    }

    const result = await Settings.set(testData)
    expect(result).toBe(true)
  })
})
```

## パフォーマンステスト

### MG-PERF-01: 取得時間比較テスト

**テストファイル**: `src/services/settings/performance.test.ts`

```typescript
describe("Settings Performance Comparison", () => {
  it("MG-PERF-01: 初回取得時間の測定", async () => {
    const startTime = performance.now()
    await enhancedSettings.get()
    const endTime = performance.now()

    const duration = endTime - startTime

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
    expect(duration2).toBeLessThan(duration1 * 0.5) // 50%以上高速化
  })

  it("MG-PERF-03: forceFresh時の取得時間", async () => {
    // キャッシュを温める
    await enhancedSettings.get()

    // forceFresh での取得時間測定
    const startTime = performance.now()
    await enhancedSettings.get({ forceFresh: true })
    const duration = performance.now() - startTime

    // 合理的な時間内での完了を確認
    expect(duration).toBeLessThan(200)
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

```yaml
# .github/workflows/migration-test.yml
name: Settings Migration Tests

on:
  push:
    branches: [settings-migration]
  pull_request:
    branches: [main]

jobs:
  migration-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "yarn"

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run migration-specific tests
        run: yarn test --testNamePattern="MG-"

      - name: Run full test suite
        run: yarn test

      - name: Build extension
        run: yarn build

      - name: Lint check
        run: yarn lint
```

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

### カバレッジ要件

- **単体テスト**: 各関数95%以上のカバレッジ
- **統合テスト**: 主要フロー100%のカバレッジ
- **E2Eテスト**: クリティカルパス100%の確認

### パス基準

- **機能テスト**: 全てのMG-\*テストケースが成功
- **パフォーマンス**: 既存実装と同等以上の性能
- **エラーハンドリング**: 想定される例外状況での適切な動作

## テストデータ管理

### モックデータ

```typescript
// src/test/fixtures/settingsData.ts
export const mockSettingsData: SettingsType = {
  settingVersion: "0.11.9",
  startupMethod: {
    method: STARTUP_METHOD.CONTEXT_MENU,
    threshold: 1,
  },
  commands: [
    {
      id: "test-command-1",
      title: "Test Command",
      iconUrl: "https://example.com/icon.png",
      // ...その他のプロパティ
    },
  ],
  folders: [],
  pageRules: [],
  popupPlacement: PopupPlacement,
  shortcuts: { shortcuts: [] },
  commandExecutionCount: 0,
  hasShownReviewRequest: false,
  stars: [],
}
```

### テスト環境の分離

```typescript
// src/test/helpers/migrationTestHelpers.ts
export class MigrationTestHelpers {
  static async setupCleanEnvironment() {
    // キャッシュクリア
    settingsCache.invalidateAll()

    // Chrome storage モックのクリア
    chrome.storage.local.clear()
    chrome.storage.sync.clear()
  }

  static async seedTestData(data: Partial<SettingsType>) {
    // テストデータの投入
    await Storage.set(STORAGE_KEY.USER, data)
  }
}
```

## 成功基準とKPI

### 定量的基準

1. **テストパス率**: 100%
2. **パフォーマンス**: 取得時間が既存実装の80%以下
3. **エラー発生率**: 0件

### 定性的基準

1. **機能完全性**: 既存機能の100%維持
2. **ユーザー体験**: 操作感の変化なし
3. **コード品質**: lint エラー 0件
4. **ドキュメント**: 移行手順の完全記録

この包括的なテスト戦略により、Settings.get() から EnhancedSettings.get() への移行を安全かつ確実に実行できる。
