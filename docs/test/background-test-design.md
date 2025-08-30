# ページアクション バックグラウンド処理の単体テスト設計

## 概要

`packages/extension/src/services/pageAction/background.ts` の単体テスト設計書です。
このファイルはページアクションの記録・実行・タブ管理を行うバックグラウンド処理の中核モジュールです。

## テスト対象の分析

### 主要エクスポート関数

1. **add()** - ページアクションステップの追加（操作統合ロジック付き）
2. **update()** - 既存ステップの部分更新
3. **remove()** - ステップの削除
4. **reset()** - 記録のリセットと開始URLへの復帰
5. **openAndRun()** - 新しいタブ/ウィンドウでの実行
6. **preview()** - プレビュー実行（開始URLからの実行）
7. **run()** - ステップの順次実行（内部関数）
8. **stopRunner()** - 実行停止
9. **openRecorder()** - レコーダーウィンドウ/タブの開設
10. **closeRecorder()** - レコーダーの終了

### Chrome イベントリスナー

- `chrome.tabs.onUpdated` - URL変更の検知
- `chrome.tabs.onRemoved` - タブ削除時の状態管理
- `chrome.windows.onBoundsChanged` - ウィンドウサイズ変更の監視

### 依存関係とモック対象

**主要サービス:**

- `@/services/ipc` - IPC通信
- `@/services/storage` - ストレージ管理
- `@/services/chrome` - Chrome API ラッパー
- `@/services/backgroundData` - BgData
- `@/services/pageAction` - RunningStatus
- `@/services/commandMetrics` - コマンド実行カウント

**ユーティリティ:**

- `@/lib/utils` - 各種ヘルパー関数
- `@/const` - 定数定義

**Chrome APIs:**

- `chrome.storage` - ストレージAPI
- `chrome.tabs` - タブ管理API
- `chrome.windows` - ウィンドウ管理API

## テストケース設計

### add() 関数のテスト（BGD-01〜BGD-20）

**基本機能（BGD-01〜05）:**

- ✅ BGD-01: 正常系: 基本的なステップ追加が成功する
- ✅ BGD-02: 正常系: 空のsteps配列に最初のステップを追加すると、StartActionが自動で挿入される
- ✅ BGD-03: 正常系: EndActionが自動で追加される
- ✅ BGD-04: 境界値: 最大ステップ数に達した場合の処理（PAGE_ACTION_MAX - 1）
- ✅ BGD-05: 正常系: URLの変更フラグがリセットされる

**操作統合ロジック（BGD-06〜15）:**

- ✅ BGD-06: 統合: 同一要素でのclick + inputはclickがスキップされる
- ✅ BGD-07: 統合: click → doubleClickで前のclickが削除される
- ✅ BGD-08: 統合: doubleClick → doubleClickで前のdoubleClickが削除される
- ✅ BGD-09: 統合: doubleClick → tripleClickで前のdoubleClickが削除される
- ✅ BGD-10: 統合: tripleClick → tripleClickで前のtripleClickが削除される
- ✅ BGD-11: 統合: scroll → scrollで前のscrollが削除され、delayMsが継承される
- ✅ BGD-12: 統合: URL変更後のscrollでDELAY_AFTER_URL_CHANGEDが設定される
- ✅ BGD-13: 統合: URL変更後のkeyboardでDELAY_AFTER_URL_CHANGEDが設定される
- ✅ BGD-14: 統合: 同一要素での連続inputが統合される（labelも継承）
- ✅ BGD-15: 統合: 同一要素での過去のinput値が新しい値から除去される
- ✅ BGD-15-b: 統合: 同一要素で、過去のinputが複数ある場合でも、全てのinput値が新しい値から除去される

**エラーケース（BGD-16〜20）:**

- ✅ BGD-16: 異常系: Storage.get でエラーが発生した場合
- ✅ BGD-17: 異常系: Storage.set でエラーが発生した場合
- ✅ BGD-18: 異常系: Storage.update でエラーが発生した場合
- ✅ BGD-19: 境界値: step.param が null/undefined の場合
- ✅ BGD-20: 境界値: context が null/undefined の場合

### update() 関数のテスト（BGD-21〜25）

**基本機能:**

- ✅ BGD-21: 正常系: 既存ステップの部分更新が成功する
- ✅ BGD-22: 正常系: ネストしたparamオブジェクトの更新が正しく行われる
- ✅ BGD-23: 境界値: 存在しないIDでの更新は何も行わない
- ✅ BGD-24: 異常系: Storage関連でエラーが発生した場合
- ✅ BGD-25: 境界値: partial が空オブジェクトの場合

### remove() 関数のテスト（BGD-26〜30）

**基本機能:**

- ✅ BGD-26: 正常系: 指定IDのステップ削除が成功する
- ✅ BGD-27: 正常系: 複数ステップから特定のIDのみ削除される
- ✅ BGD-28: 境界値: 存在しないIDでの削除は何も行わない
- ✅ BGD-29: 境界値: 空のsteps配列での削除処理
- ✅ BGD-30: 異常系: Storage関連でエラーが発生した場合

### reset() 関数のテスト（BGD-31〜35）

**基本機能:**

- ✅ BGD-31: 正常系: ステップ配列のリセットが成功する
- ✅ BGD-32: 正常系: startUrlが存在する場合、タブがURLに復帰する
- ✅ BGD-33: 境界値: startUrlが存在しない場合
- ✅ BGD-34: 境界値: tabIdが存在しない場合
- ✅ BGD-35: 異常系: chrome.tabs.update でエラーが発生した場合

### openAndRun() 関数のテスト（BGD-36〜50）

**オープンモード別テスト:**

- ✅ BGD-36: 正常系: TABモードでの新しいタブでの実行
- ✅ BGD-37: 正常系: BACKGROUND_TABモードでの背景タブでの実行
- ✅ BGD-38: 正常系: POPUPモードでのポップアップウィンドウでの実行
- ✅ BGD-39: 正常系: WINDOWモードでの通常ウィンドウでの実行

**コマンド検証:**

- ✅ BGD-40: 正常系: 有効なPageActionCommandでの実行
- ✅ BGD-41: 異常系: 存在しないcommandIdの場合
- ✅ BGD-42: 異常系: PageActionCommandではないコマンドの場合
- ✅ BGD-43: 異常系: pageActionOptionが存在しない場合

**テキスト処理:**

- ✅ BGD-44: 正常系: selectedTextが空でuseClipboardがtrueの場合、clipboardTextを使用
- ✅ BGD-45: 正常系: selectedTextが存在する場合はそのまま使用
- ✅ BGD-46: 正常系: userVariablesが正しく渡される

**エラーケース:**

- ✅ BGD-47: 異常系: tabIdの取得に失敗した場合
- ✅ BGD-48: 異常系: IPC接続の確立に失敗した場合

### preview() 関数のテスト（BGD-51〜54）

**基本機能:**

- ✅ BGD-51: 正常系: プレビュー実行が成功する
- ✅ BGD-52: 正常系: startUrlが存在する場合、タブがURLに復帰してから実行
- ✅ BGD-53: 境界値: startUrlが無効な場合
- ✅ BGD-54: 境界値: tabIdが存在しない場合

### run() 関数のテスト（BGD-56〜70）

**基本実行フロー:**

- ✅ BGD-56: 正常系: ステップの順次実行が成功する
- ✅ BGD-57: 正常系: 各ステップでRunningStatusが適切に更新される
- ✅ BGD-58: 正常系: delayMsが設定されている場合の遅延実行
- ✅ BGD-59: 正常系: endアクションで実行が正常終了する

**エラーハンドリング:**

- ✅ BGD-61: 異常系: IPC通信でエラーが発生した場合
- ✅ BGD-62: 異常系: ステップ実行でエラーが発生した場合
- ✅ BGD-63: 正常系: リトライ機能（RETRY_MAX回まで）
- ✅ BGD-64: 異常系: リトライ上限に達した場合

**実行制御:**

- ✅ BGD-66: 正常系: BgData.pageActionStopがtrueの場合の停止
- ✅ BGD-67: 正常系: finallyブロックでRunningStatusがクリアされる
- ✅ BGD-68: 異常系: RunningStatus.initTab でエラーが発生した場合
- ✅ BGD-69: 異常系: BgData.update でエラーが発生した場合
- ✅ BGD-70: 境界値: steps配列が空の場合

### stopRunner() 関数のテスト（BGD-71〜75）

- ✅ BGD-71: 正常系: stopフラグによる実行停止

### openRecorder() 関数のテスト（BGD-76〜85）

**基本機能:**

- ✅ BGD-76: 正常系: POPUPモードでレコーダーウィンドウが開設される
- ✅ BGD-77: 正常系: TABモードでレコーダータブが開設される
- ✅ BGD-78: 正常系: ウィンドウサイズと位置が正しく計算される
- ✅ BGD-79: 正常系: recordingTabIdが適切に設定される

### closeRecorder() 関数のテスト（BGD-86〜90）

**基本機能:**

- ✅ BGD-86: 正常系: レコーダータブの終了が成功する
- ✅ BGD-87: 正常系: recordingTabIdがundefinedに設定される
- ✅ BGD-88: 正常系: タブが削除される

### Chromeイベントリスナーのテスト（BGD-91〜100）

**tabs.onUpdated:**

- ✅ BGD-91: 正常系: 記録中タブのURL変更でurlChangedフラグが設定される
- ✅ BGD-92: 境界値: 記録中ではないタブのURL変更は無視される
- ✅ BGD-93: 境界値: 同じURLへの変更は無視される

**tabs.onRemoved:**

- ✅ BGD-95: 正常系: 記録中タブが削除された場合recordingTabIdがリセットされる
- ✅ BGD-96: 境界値: 記録中ではないタブの削除は無視される

**windows.onBoundsChanged:**

- ✅ BGD-97: 正常系: 記録中ウィンドウのサイズ変更がIPCで送信される
- ✅ BGD-98: 境界値: 記録中ではないウィンドウの変更は無視される

## モック設計

### Chrome API モック

```typescript
// setup.ts の既存モックを使用
global.chrome = {
  storage: setupStorageMocks("realistic"), // StorageMockFactory使用
  tabs: {
    update: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    query: vi.fn(),
    onUpdated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
  },
  windows: {
    create: vi.fn(),
    onBoundsChanged: { addListener: vi.fn() },
  },
};
```

### サービスモック

```typescript
vi.mock("@/services/storage", () => ({
  Storage: {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    getCommands: vi.fn(),
  },
  SESSION_STORAGE_KEY: {
    /* 定数モック */
  },
}));

vi.mock("@/services/ipc", () => ({
  Ipc: {
    ensureConnection: vi.fn(),
    sendTab: vi.fn(),
  },
  TabCommand: { execPageAction: "execPageAction" },
}));

vi.mock("@/services/chrome", () => ({
  openPopupWindow: vi.fn(),
  openTab: vi.fn(),
  getCurrentTab: vi.fn(),
}));

vi.mock("@/services/backgroundData", () => ({
  BgData: {
    init: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("@/services/pageAction", () => ({
  RunningStatus: {
    updateTab: vi.fn(),
    initTab: vi.fn(),
    clearTab: vi.fn(),
  },
}));
```

### ユーティリティモック

```typescript
vi.mock("@/lib/utils", () => ({
  generateRandomID: vi.fn(() => "test-id"),
  isEmpty: vi.fn(),
  isPageActionCommand: vi.fn(),
  isUrl: vi.fn(),
  isUrlParam: vi.fn(),
  sleep: vi.fn(),
}));

vi.mock("@/services/commandMetrics", () => ({
  incrementCommandExecutionCount: vi.fn(),
}));
```

## テストファイル構造

### ファイル分割方針

`background.ts`の単体テストは機能別に3つのファイルに分割されています：

#### 1. `background-crud.test.ts` (BGD-01〜BGD-35)

**対象機能**: CRUD操作（作成・読取・更新・削除）

- `add()` - ページアクションステップの追加
- `update()` - 既存ステップの部分更新
- `remove()` - ステップの削除
- `reset()` - 記録のリセットと開始URLへの復帰

**テスト方針**: データ操作ロジックと操作統合機能に重点を置いたテスト

#### 2. `background-execution.test.ts` (BGD-36〜BGD-75)

**対象機能**: 実行系操作

- `openAndRun()` - 新しいタブ/ウィンドウでの実行
- `preview()` - プレビュー実行（開始URLからの実行）
- `stopRunner()` - 実行停止
- `run()` - ステップの順次実行（内部関数、間接的にテスト）

**テスト方針**: 実行フローとエラーハンドリングに重点を置いたテスト

#### 3. `background-recorder.test.ts` (BGD-76〜BGD-100)

**対象機能**: レコーダー管理とChromeイベント監視

- `openRecorder()` - レコーダーウィンドウ/タブの開設
- `closeRecorder()` - レコーダーの終了
- Chrome イベントリスナー（`tabs.onUpdated`, `tabs.onRemoved`, `windows.onBoundsChanged`）

**テスト方針**: UI管理とブラウザイベント処理に重点を置いたテスト

### 共通テスト環境

全3ファイルで`background-shared.ts`の共通モック環境を使用し、一貫性のあるテスト実行環境を提供します。
