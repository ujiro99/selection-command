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

#### 1. `CommandStorage`クラス

- `saveCommands` - コマンドの保存機能
- `loadCommands` - コマンドの読み込み機能
- `updateCommands` - コマンド更新処理
- `calculator` - ストレージ容量計算機能

#### 2. `CommandMigrationManager`クラス

- `performMigration` - レガシーデータからの移行
- `needsMigration` - 移行が必要かの判定
- `restoreFromBackup` - バックアップからの復元

#### 3. `CommandStorage`オブジェクト

- リスナー管理（`addCommandListener`, `removeCommandListener`）

### テストケース設計

#### `CommandStorage`のテスト

**saveCommandsメソッド:**

- ✅ CS-01: 正常にコマンドを保存できる
- ✅ CS-01-a: コマンド数が減るように保存したとき、保存後のコマンド数が正しい
- ✅ CS-02: ストレージエラー時に適切に例外をスローする

**loadCommandsメソッド:**

- ✅ CS-03: メタデータが存在しない場合はDefaultCommandsを返す
- ✅ CS-04: レガシーデータが存在する場合は移行を実行する
- ✅ CS-05: 基本的な読み込み機能
- ✅ CS-05-a: sync/localからの読み込み
  - syncストレージからコマンドを正しく読み込むこと
  - localストレージからコマンドを正しく読み込むこと
  - GlobalCommandMetadataの順序、カウントが一致していること
    - syncとlocalの両方が混じった順序が正しく復元されること
- ✅ CS-05-b: syncだけの読み込み(別のブラウザで起動した場合のケース)
  - syncストレージからコマンドを正しく読み込むこと
  - localストレージのデータが無くても、syncコマンドのデータだけで正しく読み込みが完了すること
  - GlobalCommandMetadataの順序が、syncストレージのコマンドの順序で再生成されること
- ✅ CS-05-c: syncとGlobalCommandMetadataの不一致(別のブラウザから同期した場合のケース)
  - syncストレージからコマンドを正しく読み込むこと
  - localストレージからコマンドを正しく読み込むこと
  - GlobalCommandMetadataの順序、カウントが再生成されること
    - syncストレージのコマンドの削除分は、順序から除外されること
    - syncストレージのコマンドの追加分は、順序の中で一番後ろにあるsyncストレージのコマンドの直後に挿入されること

**updateCommandsメソッド:**

- ✅ CS-13: 初回更新時の処理
  - DefaultCommandsへの変更が保存される
- ✅ CS-14: 既存コマンドの更新処理(syncストレージの更新)
  - 指定したコマンドが更新され、syncストレージに保存される
  - 指定していないコマンドはそのまま残る
- ✅ CS-14-a: 既存コマンドの更新処理(localストレージの更新)
  - 指定したコマンドが更新され、localストレージに保存される
  - 指定していないコマンドはそのまま残る

**calculatorプロパティ:**

- ✅ CS-06: `calculateCommandSize`メソッドが利用可能
- ✅ CS-07: `analyzeAndAllocate`メソッドが利用可能で適切なallocationオブジェクトを返す

#### `CommandMigrationManager`のテスト

**performMigrationメソッド:**

- ✅ CS-08: レガシーデータが存在しない場合はDefaultCommandsを返す
- ✅ CS-09: レガシーデータが存在する場合は移行を実行してコマンドを復元する
- ✅ CS-09-a: レガシーデータが容量制限(60KB以上)を超える場合、syncとlocalのストレージに分配して移行する
  - このとき、syncストレージには60KBまでのコマンドが保存され、localストレージには残りのコマンドが保存される
  - このとき、GlobalCommandMetadata の globalOrder は、レガシーデータの順序を保持する
  - このとき、GlobalCommandMetadata の count は、レガシーデータのコマンド数を保持する

**needsMigrationメソッド:**

- ✅ CS-10: 移行が完了済みの場合はfalseを返す
- ✅ CS-11: レガシーデータが存在する場合はtrueを返す

**restoreFromBackupメソッド:**

- ✅ CS-12: バックアップからcommands、foldersプロパティを持つオブジェクトを復元

#### `CommandStorage`オブジェクトのテスト

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

**グローバル整合性検証:**

- ✅ CS-25: 正しい順序での検証成功
- ✅ CS-26: 不正な順序での検証失敗
- ✅ CS-27: メタデータ欠如での検証失敗

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

## index.ts の単体テスト設計

### テスト対象の分析

#### `debouncedSyncSet`関数 (index.ts:46-72)

- **機能**: 複数のストレージ操作をデバウンスして一括処理
- **デバウンス遅延**: 10ms (`SYNC_DEBOUNCE_DELAY`)
- **内部状態**: `syncSetTimeout`, `syncSetResolves`, `syncSetData` (Map)
- **Chrome API依存**: `chrome.storage.sync.set`, `chrome.runtime.lastError`

### テストケース設計

#### 基本的なデバウンス動作

- ✅ DS-01: 単一呼び出し時の正常動作
  - データが正しく`chrome.storage.sync.set`に渡される
  - Promiseが適切に解決される

- ✅ DS-02: 複数回連続呼び出し時のデバウンス
  - 最後の呼び出しから10ms後に一度だけ`chrome.storage.sync.set`が呼ばれる
  - 既存のタイムアウトが適切にクリアされる

- ✅ DS-03: データマージ動作
  - 異なるキーの値が適切にマージされる
  - 同じキーの値が後から呼ばれた値で上書きされる

#### Promise解決とエラーハンドリング

- ✅ DS-04: 成功時の全Promiseの解決
  - 複数回呼び出された全てのPromiseが解決される
  - `syncSetResolves`配列が正しくクリアされる

- ✅ DS-05: エラー時の処理
  - `chrome.runtime.lastError`が設定されている場合
  - エラーがコンソールに出力される
  - 内部状態（Map、タイムアウト、resolves配列）がクリアされる
  - Promiseは解決される（エラーで拒否されない）

#### 並行処理と状態管理

- ✅ DS-06: 並行呼び出しの処理
  - 複数の並行呼び出しが適切に処理される
  - 全てのPromiseが解決される
  - データが正しくマージされる

- ✅ DS-07: 内部状態のクリーンアップ
  - 処理完了後に`syncSetData.clear()`が呼ばれる
  - `syncSetTimeout`がnullにリセットされる
  - `syncSetResolves`配列が空になる

#### エッジケース

- ✅ DS-08: 空オブジェクトの処理
  - 空のデータオブジェクト`{}`を渡した場合の動作

- ✅ DS-09: タイムアウト中の追加呼び出し
  - タイムアウト待機中に新しい呼び出しがあった場合
  - 既存タイムアウトがクリアされ、新しいタイムアウトが設定される

### モック要件

#### Chrome API のモック

```typescript
const mockChromeStorageSync = {
  set: vi.fn().mockImplementation((data, callback) => {
    // 成功時またはエラー時の動作をシミュレート
    callback?.()
  }),
}

const mockChromeRuntime = {
  lastError: undefined, // テストケースに応じて設定
}
```

#### タイマーのモック

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})
```

### テスト実装時の注意点

1. **タイマーテスト** - `vi.useFakeTimers()`と`vi.advanceTimersByTime()`を使用
2. **非同期処理** - `async/await`でPromiseの解決を適切に待機
3. **モック状態のリセット** - 各テスト間でモックとタイマーをリセット
4. **内部状態の検証** - プライベート変数の状態変化を適切にテスト
5. **並行処理テスト** - `Promise.all()`で複数の呼び出しを同時実行
6. **Chrome API エラー** - `chrome.runtime.lastError`の設定と解除
