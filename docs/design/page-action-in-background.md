# PageAction バックグラウンド実行設計

## 概要

現在のPageActionは、ユーザーが新しいタブ/ウィンドウを開いてアクティブな状態で操作を実行する仕組みになっています。この設計では、ユーザーの作業を中断することになるため、バックグラウンドタブでの実行を可能にすることで、よりシームレスな体験を提供します。

## 実現性評価

### ✅ 実現可能な要素

1. **Content Script実行**: Chrome拡張機能のcontent scriptはバックグラウンドタブでも動作可能
2. **DOM操作**: 基本的なDOM操作（要素検索、値設定、イベント発火）は実行可能
3. **IPC通信**: background script ↔ content script間の通信は正常に動作
4. **状態管理**: ストレージベースの実行状態管理は問題なし

### ⚠️ 制約・課題

#### Chrome拡張機能の制約

1. **Manifest V3制約**: Service workerはDOMにアクセス不可（現在の設計は対応済み）
2. **Content Script注入遅延**: バックグラウンドタブでのcontent script注入にタイミング問題の可能性
3. **パフォーマンス制限**: バックグラウンドタブでのJavaScript実行は制限される場合がある

#### 現在の実装での制約

1. **アクティブタブ前提**: `openTab({ active: true })` でタブを強制的にアクティブ化
2. **Focus依存処理**: `listener.ts`でfocus関連の状態管理を多用
3. **UserEvent制限**: `@testing-library/user-event`はバックグラウンドタブで制限有り
4. **視覚的フィードバック**: スムーズスクロールなどの視覚効果が意味を持たない
5. **単一実行制限**: 現在の状態管理は1つのPageAction実行状態のみ追跡可能
6. **タブ間競合**: 複数タブでの同時実行時に実行状態が混在・上書きされる

#### 操作別の制約詳細

**Click操作**:

- ✅ 基本的なクリックイベント発火は可能
- ⚠️ focus/blur イベントの動作が不安定
- ⚠️ 要素の可視性チェックが困難

**Input操作**:

- ✅ 値の設定は可能
- ⚠️ input/change イベントの発火タイミングが異なる可能性
- ⚠️ IME関連の処理は動作しない

**Keyboard操作**:

- ✅ KeyboardEventの発火は可能
- ⚠️ 修飾キー（Ctrl/Meta）の変換処理は動作
- ⚠️ Tab操作によるフォーカス移動は不安定

**Scroll操作**:

- ✅ scrollTo自体は実行可能
- ❌ `scrollend`イベントが発火しない可能性
- ❌ スムーズスクロールの視覚効果は不要

## 設計方針

### 1. PAGE_ACTION_OPEN_MODEの拡張

```typescript
// @/const.ts
export enum OPEN_MODE {
  POPUP = "popup",
  WINDOW = "window",
  TAB = "tab",
  BACKGROUND_TAB = "backgroundTab", // <- new!
  API = "api",
  PAGE_ACTION = "pageAction",
  LINK_POPUP = "linkPopup",
  COPY = "copy",
  GET_TEXT_STYLES = "getTextStyles",
  OPTION = "option",
  ADD_PAGE_RULE = "addPageRule",
}

export enum PAGE_ACTION_OPEN_MODE {
  NONE = "none",
  POPUP = OPEN_MODE.POPUP,
  TAB = OPEN_MODE.TAB,
  BACKGROUND_TAB = OPEN_MODE.BACKGROUND_TAB, // <- new!
  WINDOW = OPEN_MODE.WINDOW,
}

interface PageActionOptions {
  openMode: PAGE_ACTION_OPEN_MODE;
  waitForVisibility?: boolean; // 要素の可視性を待つか
  enableVisualFeedback?: boolean; // 視覚的フィードバックを有効にするか
}
```

### 2. 複数タブ並列実行の設計

#### 現在の状態管理の問題

- **単一実行状態**: Session Storageで1つの`PageActiontStatus`のみ管理
- **状態の上書き**: 新しいPageAction開始時に前の状態が失われる
- **タブ固有情報の欠如**: 複数タブでの実行状態を区別できない

#### 提案する状態管理構造

```typescript
// 現在の構造
interface PageActiontStatus {
  tabId: number;
  stepId: string;
  results: PageActiontResult[];
}

// 提案する新構造
interface MultiTabPageActionStatus {
  [tabId: number]: PageActiontStatus;
}

// 実行制御のメタデータ
interface PageActionExecutionMeta {
  activeExecutions: number[]; // 実行中のタブIDリスト
}
```

#### 並列実行制御の考慮事項

1. **エラー隔離**: 1つのタブでのエラーが他のタブに影響しない設計
2. **状態同期**: タブ間での状態情報の整合性確保

### 3. 段階的実装アプローチ

#### Phase 1: インフラ整備

- BACKGROUND_TAB enum値追加
- バックグラウンド実行用のdispatcher実装
- openAndRun関数の分岐処理追加
- 国際化対応

#### Phase 1.5: 複数タブ並列実行対応 ✅ **完了**

- ✅ `MultiTabPageActionStatus`構造への移行
- ✅ `RunningStatus`サービスのタブID別操作対応
- ✅ 競合状態の解決（グローバル変数currentTabIdを削除）
- ✅ マルチタブ対応状態管理の統一
- 自動クリーンアップ機能の実装

#### Phase 2: 操作別対応

- Focus非依存のXPath解決
- バックグラウンド対応のイベント発火
- 待機処理の最適化

#### Phase 3: 最適化・改善

- パフォーマンス最適化
- エラー回復機能
- ユーザーフィードバック改善
- 同時実行制限とキューイング

## 技術設計

### アーキテクチャ変更

```
現在:
┌─────────────┐    ┌─────────────┐
│ background  │───▶│ Active Tab  │
│ script      │    │ (new tab)   │
└─────────────┘    └─────────────┘

提案 - シングル実行:
┌─────────────┐    ┌─────────────┐
│ background  │───▶│ Background  │
│ script      │    │ Tab         │
└─────────────┘    └─────────────┘

提案 - マルチタブ並列実行:
┌─────────────┐    ┌─────────────┐
│ background  │───▶│ Background  │
│ script      │    │ Tab A       │
│             │    └─────────────┘
│             │    ┌─────────────┐
│             │───▶│ Background  │
│             │    │ Tab B       │
│             │    └─────────────┘
│             │    ┌─────────────┐
│             │───▶│ Background  │
│             │    │ Tab C       │
└─────────────┘    └─────────────┘
        │
        ▼
┌─────────────────────┐
│ Multi-Tab Status    │
│ Management          │
│ - Tab A: Running    │
│ - Tab B: Completed  │
│ - Tab C: Failed     │
└─────────────────────┘
```

### 1. 複数タブ並列実行対応の状態管理 ✅ **実装完了**

#### RunningStatusサービスの拡張

複数タブでの並列実行に対応するため、現在の単一状態管理から以下の機能を持つサービスに拡張：

- ✅ **タブ別状態管理**: 各タブIDをキーとした状態管理
- ✅ **状態の初期化**: 新しいタブでの実行開始時の状態設定（`initTab`）
- ✅ **状態の更新**: 特定タブの実行状態更新（`updateTab`）
- ✅ **状態の取得**: 特定タブまたは全タブの状態取得（`getTab`/`getAll`）
- ✅ **状態の削除**: 完了したタブの状態クリーンアップ（`clearTab`/`clear`）
- ✅ **競合状態の解決**: グローバル変数`currentTabId`を削除し、明示的なタブID指定によるAPI統一

### 2. Background用Dispatcher実装

バックグラウンドタブ実行に特化したDispatcherの実装：

- **可視性チェックなしの要素取得**: バックグラウンドタブでは要素の可視性確認を省略
- **直接イベント発火**: `@testing-library/user-event`の代わりに`MouseEvent`等を直接発火
- **Focus非依存処理**: focus/blurイベントに依存しない実装

### 3. Focus非依存の要素解決

バックグラウンドタブでの要素取得に特化した実装：

- **XPath解決の改善**: focus状態に依存しないXPath要素解決
- **待機間隔の調整**: バックグラウンドタブでの実行制限を考慮した適切な間隔設定
- **タイムアウト処理**: 要素が見つからない場合の適切なエラー処理

### 4. 実行制御の変更

background scriptでの実行制御ロジック：

- **タブ開き方の分岐**: `BACKGROUND_TAB`モード時は`active: false`でタブを開く
- **Dispatcher選択**: 実行モードに応じて適切なDispatcherを選択
- **状態管理の統合**: 複数タブに対応した状態管理サービスの利用

### 5. UI変更

- **選択肢の追加**: `BACKGROUND_TAB`を`PAGE_ACTION_OPEN_MODE`の選択肢に追加
- **国際化対応**: 日本語・英語の翻訳メッセージを追加
- **状態表示の改善**: 複数タブの実行状態を適切に表示

## 制限事項・注意点

### 1. 完全な互換性は不可能

- Focus関連の動作は異なる挙動となる
- 視覚的フィードバックは利用できない
- 一部のJavaScript APIは制限される

### 2. パフォーマンス考慮

- バックグラウンドタブでの実行は遅くなる可能性
- タイムアウト時間の調整が必要

### 3. ユーザーエクスペリエンス

- 実行結果の通知方法を工夫する必要
- エラー時の対処方法を明確にする
- プログレス表示の改善が必要

## 実装優先度

### High Priority (必須)

#### バックグラウンド実行基盤

- [ ] OPEN_MODE.BACKGROUND_TAB enum値追加
- [ ] PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB enum値追加
- [ ] BackgroundPageActionDispatcher実装
- [ ] バックグラウンド用要素解決ロジック
- [ ] openAndRun関数でのBACKGROUND_TABモード対応
- [ ] 国際化メッセージ追加

#### 複数タブ並列実行対応

- [x] MultiTabPageActionStatus型定義追加
- [x] RunningStatusサービス実装（旧MultiTabRunningStatus）
- [x] 競合状態の解決（グローバルcurrentTabId削除）
- [x] マルチタブ対応状態管理の統一
- [ ] PageActionExecutionController実装
- [ ] SESSION_STORAGE_KEY.PA_MULTI_RUNNING追加
- [ ] PageActionRunnerコンポーネントのマルチタブ対応
- [ ] usePageActionRunnerフックのマルチタブ対応

### Medium Priority (推奨)

- [ ] エラーハンドリング強化
- [ ] 通知システム改善
- [ ] パフォーマンス最適化
- [ ] テストケース追加

### Low Priority (将来)

- [ ] バックグラウンド実行の統計取得
- [ ] 高度なエラー回復機能
- [ ] バッチ実行機能
- [ ] タブ間での実行状態共有とモニタリング

## 実装状況と結論

### 完了済み機能 ✅

**複数タブ並列実行対応の状態管理**（2025年1月実装）:

- 競合状態の問題を完全に解決
- `RunningStatus`による明示的なタブID指定API
- マルチタブ対応の実行状態管理
- 安全で拡張性の高い設計への統一

### 今後の実装

PageActionのバックグラウンド実行と複数タブでの並列実行は**技術的に実現可能**ですが、いくつかの制約があります。段階的なアプローチで実装し、ユーザーには実行モードの選択肢を提供することで、従来の安定性を保ちながら新機能を提供できます。

### 実装アプローチ

1. **Phase 1**: バックグラウンド実行の基盤を構築
2. **Phase 1.5**: 複数タブ並列実行に対応した状態管理に拡張
3. **Phase 2**: 操作別の最適化と安定化
4. **Phase 3**: パフォーマンス最適化と高度な機能追加

### 主要な利点

- **ユーザー体験の向上**: 作業を中断せずにPageActionを実行
- **効率性の向上**: 複数タブで並列実行により処理時間短縮
- **柔軟性の向上**: 実行モードを選択可能

### 重要な考慮事項

- **エラー処理**: 1つのタブのエラーが他に影響しない設計
- **状態管理**: 複数タブに対応した状態管理の適切な設計と実装

最初は基本的な操作（click, input）から対応し、動作が安定してから他の操作に拡張することを推奨します。
