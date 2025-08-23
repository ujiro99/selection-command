# PageAction設計ドキュメント

## 概要

PageActionは、ユーザーのブラウザ操作を記録・再生する機能を提供するモジュールです。
Chrome拡張機能のバックグラウンドスクリプトとして動作し、ユーザーの操作を
効率的にキャプチャし、後で自動実行することができます。

## アーキテクチャ

### ファイル構成

- `background.ts`: バックグラウンド処理のメイン実装（記録・実行・タブ管理）
- `dispatcher.ts`: アクション実行エンジン（ユーザー操作のシミュレーション）
- `listener.ts`: イベントキャプチャエンジン（ユーザー操作の検知・記録）
- `status.ts`: 実行ステータス管理（リアルタイム進捗追跡）
- `helper.ts`: ユーティリティ関数群（文字列変換・国際化対応）
- `index.ts`: モジュールエクスポート定義

### 主要コンポーネント

#### 1. アクション管理システム

**Recording System**

- ユーザーの操作（クリック、入力、スクロール、キーボード等）をPageActionStepとして記録
- 各stepは一意のIDと実行パラメータを持つ
- セッションストレージ（`SESSION_STORAGE_KEY.PA_RECORDING`）で状態を管理

**Execution System**

- 記録されたstepを順次実行してページアクションを再現
- 実行状態の監視とエラーハンドリング
- 実行の停止・再開機能

**State Management**

- `PageActionRecordingData`: 記録データの管理
- `PageActionContext`: 実行コンテキストの管理
- `RunningStatus`: 実行ステータスの追跡

#### 2. 主要関数群

**記録関連機能**

- `add()`: 新しいアクションstepの追加
  - 重複操作の除去（同一要素での連続input等）
  - 操作の統合（click → doubleClick → tripleClick）
  - 最大step数の制限（`PAGE_ACTION_MAX`）
- `update()`: 既存stepの部分更新
- `remove()`: stepの削除
- `reset()`: 記録のリセットと開始URLへの復帰

**実行関連機能**

- `run()`: stepの順次実行
  - 各stepの実行状態監視
  - エラー時の実行停止
  - 遅延時間の考慮
- `openAndRun()`: 新しいタブ/ウィンドウでの実行
  - タブ/ウィンドウ/ポップアップモードの選択
  - クリップボードテキストの活用
- `preview()`: プレビュー実行（開始URLからの実行）
- `stopRunner()`: 実行停止

**レコーダー管理機能**

- `openRecorder()`: レコーダーウィンドウ/タブの開設
- `closeRecorder()`: レコーダーの終了

#### 3. 最適化機能

**操作の統合**

- 同じ要素での連続操作を1つにまとめる
  - input要素での複数入力を最終的な値に統合
  - click後のdoubleClickで前のclickを削除
- 無駄な操作の除去
  - 同じselectorでのclick + inputの場合、clickをスキップ

**遅延制御**

- URL変更後の適切な待機時間設定（`DELAY_AFTER_URL_CHANGED`）
- scroll操作での前回の遅延時間の継承
- 各stepの`delayMs`による実行間隔制御

**特殊制御**

- Start/Endアクションの自動挿入
- URLパラメータとクリップボードテキストの使い分け

#### 4. タブ監視システム

**タブイベント監視**

- `chrome.tabs.onUpdated`: URL変更の検知とコンテキスト更新
- `chrome.tabs.onRemoved`: レコーディングタブ削除時の状態リセット
- `chrome.windows.onBoundsChanged`: ウィンドウサイズ変更の監視

**状態管理**

- `recordingTabId`: 現在記録中のタブID
- `urlChanged`: URL変更フラグ（遅延制御に使用）

## データフロー

1. **記録フェーズ**
   - ユーザー操作 → content_script → IPC → `add()` → Storage更新
   - 操作の最適化とvalidationを実行

2. **実行フェーズ**
   - Storage読み込み → `run()` → 各step実行 → RunningStatus更新
   - IPC経由でcontent_scriptに実行指示

3. **監視フェーズ**
   - Chrome APIイベント監視 → 状態更新 → context更新

## 設計原則

1. **堅牢性**: エラーハンドリングと状態管理の徹底
2. **効率性**: 無駄な操作の除去と最適化
3. **拡張性**: stepベースの設計で新しい操作タイプに対応可能
4. **ユーザビリティ**: 直感的な記録・再生体験の提供

## 技術的詳細

- **通信**: IPCを使用したbackground ↔ content_script間の通信
- **ストレージ**: Chrome extension storage APIによる永続化
- **並行性**: async/awaitによる非同期処理の制御
- **型安全性**: TypeScriptによる型定義と検証

## ファイル別詳細設計

### dispatcher.ts - アクション実行エンジン

**役割**: 記録されたアクションを実際のDOM操作として実行

**主要機能**:

- `PageActionDispatcher`: 各アクションタイプの実行メソッドを提供
  - `click/doubleCilck/tripleClick`: userEventを使用したクリック操作
  - `keyboard`: KeyboardEventによるキーボード操作（Mac/Windows間のCtrl/Meta変換対応）
  - `input`: テキスト入力（変数置換機能付き：選択テキスト、URL、クリップボード）
  - `scroll`: スムーズスクロール実行

**技術特徴**:

- `waitForElement`: タイムアウト付きの要素待機（デフォルト2秒）
- XPath/CSSセレクター両対応
- userEventライブラリによる自然なユーザー操作シミュレーション
- scrollendイベントによるスクロール完了検知

### listener.ts - イベントキャプチャエンジン

**役割**: ユーザーの操作をリアルタイムで検知・記録

**主要機能**:

- `PageActionListener`: DOM イベントリスナーの管理
  - `start/stop`: イベントリスナーの開始/停止
  - 操作別イベントハンドラー（click, keyboard, input, scroll）

**最適化機能**:

- **重複操作の除去**:
  - mousedown後のclick無視
  - 同一要素での連続input統合
  - 編集中要素でのクリック無視
- **XPath生成**: RobulaPlus使用による堅牢なセレクター生成
- **ラベル自動生成**: 要素の名前、プレースホルダー、aria-labelから識別名生成

**入力フィルタリング**:

- ポップアップ要素の操作除外
- ファンクションキー・修飾キーのフィルタリング
- contentEditable要素対応

### status.ts - 実行ステータス管理

**役割**: アクション実行中のリアルタイム進捗管理

**主要機能**:

- `RunningStatus`: 実行状態の CRUD操作
  - `init`: 実行前の初期化（全stepを Queue状態に設定）
  - `update`: step単位での状態更新（Start → Doing → Done/Failed）
  - `get/subscribe/unsubscribe`: 状態の取得・購読

**ステータス管理**:

- 実行状態: Queue → Start → Doing → Done/Failed/Stop
- step単位での進捗追跡
- エラーメッセージの記録
- 実行時間の測定

### helper.ts - ユーティリティ関数

**役割**: 文字列変換と国際化対応

**主要機能**:

- **変数置換機能**:
  - `convReadableKeysToSymbols`: UI表示用文字列 → 内部シンボル変換
  - `convSymbolsToReadableKeys`: 内部シンボル → UI表示用文字列変換
- **パラメータ表示**: `paramToStr` - 各アクションタイプの表示文字列生成
- **国際化対応**: i18nサービスと連携した多言語対応

### index.ts - モジュール定義

**役割**: 外部向けAPI定義とエクスポート管理

**エクスポート内容**:

- 各サブモジュールの型定義・関数
- `INSERT` enum: 変数挿入タイプ定義
- `InsertSymbol`: 変数シンボルマッピング

## レイヤーアーキテクチャ

```
┌─────────────────┐
│   background.ts │  ← コントローラー層（記録管理・実行制御）
├─────────────────┤
│   listener.ts   │  ← キャプチャ層（イベント検知）
│   dispatcher.ts │  ← 実行層（DOM操作実行）
├─────────────────┤
│    status.ts    │  ← ステータス管理層
│    helper.ts    │  ← ユーティリティ層
└─────────────────┘
```

この設計により、ユーザーのブラウザ操作を効率的に記録・再生する堅牢で拡張可能なシステムが実現されています。
