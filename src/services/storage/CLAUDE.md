# Storage Service Test Design

## storageUsage.ts の単体テスト設計

### テスト対象の分析

#### 1. `getStorageUsage`関数

- Chrome storage APIs (`chrome.storage.sync`, `chrome.storage.local`) への依存
- 複数のPromiseベースの非同期処理
- 複雑な計算ロジック（使用量・パーセンテージ計算）
- ストレージ制限値の定数（sync: 100KB, local: 10MB, reserved: 40KB）

#### 2. `subscribeStorageUsage`関数

- `chrome.storage.onChanged`リスナーの管理
- コールバック実行とエラーハンドリング
- 初期呼び出しとクリーンアップ機能

#### 3. `formatPercentage`ヘルパー関数

- パーセンテージ計算とフォーマット
- 10%未満は小数点1桁、10%以上は整数表示

### テストケース設計

#### `getStorageUsage`関数のテスト

**正常ケース:**

- ✅ 基本的な使用量計算が正しく行われる
- ✅ syncとlocalの両方で適切なデータが取得される
- ✅ システムキー、コマンドキー、バックアップキーが正しく分類される
- ✅ パーセンテージ計算が正確（10%未満は小数点1桁、10%以上は整数）
- ✅ 予約領域の残り容量が正しく計算される（reservedRemain = 40KB - syncSystemBytes）
- ✅ 自由容量の計算が正確（syncFree = 100KB - 40KB - syncCommandBytes）

**境界値テスト:**

- ✅ 空のストレージ（すべて0バイト）
- ✅ 最大容量に近い使用量
- ✅ コマンドキーが存在しない場合（syncCommandKeys.length = 0）
- ✅ バックアップキーが存在しない場合（localBackupKeys.length = 0）
- ✅ システムキーが存在しない場合（localSystemKeys.length = 0）

**エラーケース:**

- ✅ `chrome.storage.sync.getBytesInUse`でエラーが発生
- ✅ `chrome.storage.local.getBytesInUse`でエラーが発生
- ✅ `chrome.storage.sync.get`でエラーが発生
- ✅ `chrome.storage.local.get`でエラーが発生
- ✅ APIから予期しないデータ（null/undefined）が返される

#### `subscribeStorageUsage`関数のテスト

**正常ケース:**

- ✅ 初期呼び出しでコールバックが実行される
- ✅ ストレージ変更時にコールバックが実行される
- ✅ unsubscribe関数が正しく動作する（リスナーが削除される）
- ✅ 複数のサブスクリプションが独立して動作する

**エラーケース:**

- ✅ `getStorageUsage`でエラーが発生した場合の処理（コンソールエラー出力、コールバック実行なし）
- ✅ Chrome storage APIでエラーが発生した場合、コールバックは実行されずconsole.errorのみ呼び出される

#### `formatPercentage`ヘルパー関数のテスト

**境界値テスト:**

- ✅ 0%の場合 → "0.0"
- ✅ 10%未満の場合 → 小数点1桁（例: "5.5", "9.9"）
- ✅ 10%以上の場合 → 整数（例: "10", "50", "99"）
- ✅ 100%の場合 → "100"
- ✅ 小数点以下の丸め処理が正確

### モックの準備

#### Chrome APIs

```typescript
// storage.sync APIs
chrome.storage.sync.getBytesInUse
chrome.storage.sync.get
chrome.storage.onChanged.addListener
chrome.storage.onChanged.removeListener

// storage.local APIs
chrome.storage.local.getBytesInUse
chrome.storage.local.get
```

#### テストデータ構造

```typescript
// システムキー（STORAGE_KEY values）
const mockSyncSystemKeys = ["0", "2", "3", "4", "5"]

// ローカルシステムキー（LOCAL_STORAGE_KEY values excluding backups）
const mockLocalSystemKeys = ["caches", "clientId", "stars", "captures", ...]

// バックアップキー
const mockLocalBackupKeys = [
  "commandsBackup",
  "dailyCommandsBackup",
  "weeklyCommandsBackup"
]

// コマンドキー（CMD_PREFIX = "cmd-"）
const mockSyncCommandKeys = ["cmd-0", "cmd-1", "cmd-2"]
const mockLocalCommandKeys = ["cmd-local-0", "cmd-local-1"]
```

#### テストシナリオ例

```typescript
describe("getStorageUsage", () => {
  beforeEach(() => {
    // Chrome APIs mock setup
    vi.mocked(chrome.storage.sync.getBytesInUse).mockImplementation(...)
    vi.mocked(chrome.storage.local.getBytesInUse).mockImplementation(...)
    vi.mocked(chrome.storage.sync.get).mockImplementation(...)
    vi.mocked(chrome.storage.local.get).mockImplementation(...)
  })

  it("should calculate storage usage correctly", async () => {
    // Mock data setup
    const mockSyncData = {
      "0": "userSettings",
      "cmd-0": "command1",
      "cmd-1": "command2"
    }

    const mockLocalData = {
      "caches": "cacheData",
      "commandsBackup": "backupData",
      "cmd-local-0": "localCommand1"
    }

    // Expected calculations
    const expectedSyncUsed = 1000 // total sync bytes
    const expectedReservedRemain = 40960 - 500 // 40KB - system bytes
    const expectedSyncFree = 102400 - 40960 - 300 // 100KB - reserved - commands

    // Test execution and assertions
    const result = await getStorageUsage()
    expect(result.sync.used).toBe(expectedSyncUsed)
    expect(result.sync.reservedRemain).toBe(expectedReservedRemain)
    expect(result.sync.free).toBe(expectedSyncFree)
  })
})
```

### テスト実装時の注意点

1. **非同期処理のテスト** - `async/await`を適切に使用
2. **モックの戻り値** - 各APIが返すデータ形式を正確に模倣
3. **エラーハンドリング** - `try/catch`ブロックのテスト
4. **計算精度** - floating point計算の誤差を考慮
5. **リスナー管理** - メモリリークを避けるためのクリーンアップ
6. **テスト間の独立性** - 各テスト間でモック状態をリセット

### 参考情報

- Chrome Storage API制限:
  - sync: 100KB総容量、8KB/アイテム
  - local: 10MB総容量（Chrome 114以降は無制限）
- 予約領域: 40KB（システムデータ用）
- コマンドプレフィックス: "cmd-"（sync）、"cmd-local-"（local）
