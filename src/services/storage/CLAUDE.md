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

- ✅ SU-01: 基本的な使用量計算が正しく行われる
- ✅ SU-02: syncとlocalの両方で適切なデータが取得される
- ✅ SU-03: システムキー、コマンドキー、バックアップキーが正しく分類される
- ✅ SU-04: パーセンテージ計算が正確（10%未満は小数点1桁、10%以上は整数）
- ✅ SU-05: 予約領域の残り容量が正しく計算される（reservedRemain = 40KB - syncSystemBytes）
- ✅ SU-06: 自由容量の計算が正確（syncFree = 100KB - 40KB - syncCommandBytes）

**境界値テスト:**

- ✅ SU-07: 空のストレージ（すべて0バイト）
- ✅ SU-08: 最大容量に近い使用量
- ✅ SU-09: コマンドキーが存在しない場合（syncCommandKeys.length = 0）
- ✅ SU-10: バックアップキーが存在しない場合（localBackupKeys.length = 0）
- ✅ SU-11: システムキーが存在しない場合（localSystemKeys.length = 0）

**エラーケース:**

- ✅ SU-12: `chrome.storage.sync.getBytesInUse`でエラーが発生
- ✅ SU-13: `chrome.storage.local.getBytesInUse`でエラーが発生
- ✅ SU-14: `chrome.storage.sync.get`でエラーが発生
- ✅ SU-15: `chrome.storage.local.get`でエラーが発生
- ✅ SU-16: APIから予期しないデータ（null/undefined）が返される

#### `subscribeStorageUsage`関数のテスト

**正常ケース:**

- ✅ SU-17: 初期呼び出しでコールバックが実行される
- ✅ SU-18: ストレージ変更時にコールバックが実行される
- ✅ SU-19: unsubscribe関数が正しく動作する（リスナーが削除される）
- ✅ SU-20: 複数のサブスクリプションが独立して動作する

**エラーケース:**

- ✅ SU-21: `getStorageUsage`でエラーが発生した場合の処理（コンソールエラー出力、コールバック実行なし）
- ✅ SU-22: Chrome storage APIでエラーが発生した場合、コールバックは実行されずconsole.errorのみ呼び出される

#### `formatPercentage`ヘルパー関数のテスト

**境界値テスト:**

- ✅ SU-23: 0%の場合 → "0.0"
- ✅ SU-24: 10%未満の場合 → 小数点1桁（例: "5.5", "9.9"）
- ✅ SU-25: 10%以上の場合 → 整数（例: "10", "50", "99"）
- ✅ SU-26: 100%の場合 → "100"
- ✅ SU-27: 小数点以下の丸め処理が正確

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

## commandStorage.ts の単体テスト設計

### テスト対象の分析

#### 1. `HybridCommandStorage`クラス

- `saveCommands` - コマンドの保存機能
- `loadCommands` - コマンドの読み込み機能
- `calculator` - ストレージ容量計算機能

#### 2. `CommandMigrationManager`クラス

- `performMigration` - レガシーデータからの移行
- `needsMigration` - 移行が必要かの判定
- `restoreFromBackup` - バックアップからの復元

#### 3. `CommandStorage`オブジェクト

- `updateCommands` - コマンド更新処理
- リスナー管理（`addCommandListener`, `removeCommandListener`）

### テストケース設計

#### `HybridCommandStorage`のテスト

**saveCommandsメソッド:**

- ✅ CS-01: 正常にコマンドを保存できる
- ✅ CS-02: ストレージエラー時に適切に例外をスローする

**loadCommandsメソッド:**

- ✅ CS-03: メタデータが存在しない場合はDefaultCommandsを返す
- ✅ CS-04: レガシーデータが存在する場合は移行を実行する
- ✅ CS-05: 基本的な読み込み機能をデモンストレーション

**calculatorプロパティ:**

- ✅ CS-06: `calculateCommandSize`メソッドが利用可能
- ✅ CS-07: `analyzeAndAllocate`メソッドが利用可能で適切なallocationオブジェクトを返す

#### `CommandMigrationManager`のテスト

**performMigrationメソッド:**

- ✅ CS-08: レガシーデータが存在しない場合はDefaultCommandsを返す
- ✅ CS-09: レガシーデータが存在する場合は移行を実行してコマンドを復元する

**needsMigrationメソッド:**

- ✅ CS-10: 移行が完了済みの場合はfalseを返す
- ✅ CS-11: レガシーデータが存在する場合はtrueを返す

**restoreFromBackupメソッド:**

- ✅ CS-12: バックアップからcommands、foldersプロパティを持つオブジェクトを復元

#### `CommandStorage`オブジェクトのテスト

**updateCommandsメソッド:**

- ✅ CS-13: 初回更新時の処理（DefaultCommandsから開始）
- ✅ CS-14: 既存コマンドの更新処理

**リスナー管理:**

- ✅ CS-15: コマンド変更リスナーの追加と削除が正常に動作

#### ストレージ容量計算のテスト

**コマンドサイズ計算:**

- ✅ CS-16: 基本的なコマンドサイズ計算が正確
- ✅ CS-17: キーオーバーヘッドを含めた計算
- ✅ CS-18: 大容量コマンド（8KB以上）の処理

**コマンド割り当て:**

- ✅ CS-19: サイズに基づく適切なストレージ割り当て
- ✅ CS-20: sync/localストレージへのバランシング
- ✅ CS-21: 容量制限（sync: 60KB）を超える場合の処理
- ✅ CS-22: 総コマンド数の保持

#### メタデータ検証のテスト

**コマンド整合性検証:**

- ✅ CS-23: 正しいデータでの検証成功（count、checksumが一致）
- ✅ CS-24: 不正なカウントでの検証失敗

**グローバル整合性検証:**

- ✅ CS-25: 正しい順序での検証成功
- ✅ CS-26: 不正な順序での検証失敗
- ✅ CS-27: メタデータ欠如での検証失敗

### モック設計

#### Chrome Storage APIs

```typescript
// Sync storage
chrome.storage.sync.get
chrome.storage.sync.set

// Local storage
chrome.storage.local.get
chrome.storage.local.set

// Storage change listener
chrome.storage.onChanged.addListener
chrome.storage.onChanged.removeListener
```

#### 依存モジュール

```typescript
// storage/index.ts のモック
;(BaseStorage.get, BaseStorage.set)
;(STORAGE_KEY, LOCAL_STORAGE_KEY, CMD_PREFIX, KEY)
debouncedSyncSet

// backupManager.ts のモック
LegacyBackupManager

// const.ts のモック
;(VERSION, OPEN_MODE)

// option/defaultSettings.ts のモック
DefaultCommands
```

### テストヘルパー関数

#### `createCommand`

- 指定されたIDとサイズでテスト用Commandオブジェクトを生成
- サイズパラメータでコマンドの大きさを調整可能

### テスト実装時の注意点

1. **モック設定の順序** - 依存モジュールを先にモック、その後実装をインポート
2. **プライベートメソッドのテスト** - `(instance as any).methodName`でアクセス
3. **非同期処理** - `async/await`でPromiseベースの処理を適切にテスト
4. **容量計算精度** - バイト計算とJSON Stringifyの結果を比較
5. **チェックサム計算** - djb2ハッシュアルゴリズムの正確な実装
6. **エラーハンドリング** - `expect().rejects.toThrow()`でエラーケースをテスト
