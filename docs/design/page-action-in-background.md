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
  openMode: PAGE_ACTION_OPEN_MODE
  waitForVisibility?: boolean // 要素の可視性を待つか
  enableVisualFeedback?: boolean // 視覚的フィードバックを有効にするか
}
```

### 2. 段階的実装アプローチ

#### Phase 1: インフラ整備

- BACKGROUND_TAB enum値追加
- バックグラウンド実行用のdispatcher実装
- openAndRun関数の分岐処理追加
- 国際化対応

#### Phase 2: 操作別対応

- Focus非依存のXPath解決
- バックグラウンド対応のイベント発火
- 待機処理の最適化

#### Phase 3: 最適化・改善

- パフォーマンス最適化
- エラー回復機能
- ユーザーフィードバック改善

## 技術設計

### アーキテクチャ変更

```
現在:
┌─────────────┐    ┌─────────────┐
│ background  │───▶│ Active Tab  │
│ script      │    │ (new tab)   │
└─────────────┘    └─────────────┘

提案:
┌─────────────┐    ┌─────────────┐
│ background  │───▶│ Background  │
│ script      │    │ Tab         │
└─────────────┘    └─────────────┘
```

### 1. Background用Dispatcher実装

```typescript
export const BackgroundPageActionDispatcher = {
  click: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param

    // バックグラウンド用の要素取得（可視性チェックなし）
    const element = await waitForElementBackground(selector, selectorType)
    if (element) {
      // userEventの代わりに直接イベント発火
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
      element.dispatchEvent(clickEvent)
    } else {
      return [false, `Element not found: ${param.label}`]
    }
    return [true]
  },

  // その他の操作も同様に実装...
}
```

### 2. Focus非依存の要素解決

```typescript
async function waitForElementBackground(
  selector: string,
  selectorType: SelectorType,
  timeout: number = TIMEOUT,
): Promise<HTMLElement | null> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime
      if (elapsedTime > timeout) {
        clearInterval(interval)
        resolve(null)
        return
      }

      let element: HTMLElement | null = null
      if (selectorType === SelectorType.xpath) {
        element = getElementByBackgroundXPath(selector) // Focus非依存版
      } else {
        element = document.querySelector(selector)
      }

      if (element) {
        clearInterval(interval)
        resolve(element)
      }
    }, 100) // バックグラウンドタブでは間隔を長めに
  })
}
```

### 3. 実行制御の変更

```typescript
// background.ts
export const openAndRun = (
  param: OpenAndRunProps,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const open = async () => {
    let tabId: number

    if (param.openMode === PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB) {
      // バックグラウンドタブで実行
      const ret = await openTab({
        url: param.url,
        active: false, // アクティブ化しない
      })
      tabId = ret.tabId
    } else if (param.openMode === PAGE_ACTION_OPEN_MODE.TAB) {
      // 通常のタブで実行
      const ret = await openTab({
        url: param.url,
        active: true,
      })
      tabId = ret.tabId
    } else {
      // ポップアップ・ウィンドウモード（従来通り）
      const ret = await openPopupWindow({
        ...param,
        type:
          param.openMode === PAGE_ACTION_OPEN_MODE.WINDOW
            ? POPUP_TYPE.NORMAL
            : POPUP_TYPE.POPUP,
      })
      tabId = ret.tabId
    }

    // バックグラウンド実行用のdispatcherを使用
    const dispatcher =
      param.openMode === PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB
        ? BackgroundPageActionDispatcher
        : PageActionDispatcher

    // 実行...
  }
  // ...
}
```

### 4. UI変更

```typescript
// PageActionSection.tsx で BACKGROUND_TAB を選択肢に追加
// 既存のコードで e2a(PAGE_ACTION_OPEN_MODE) により自動的に選択肢に含まれる

// 国際化対応
// @/public/_locales/ja/messages.json
{
  "PageAction_openModebackgroundTab": {
    "message": "バックグラウンドタブ"
  }
}

// @/public/_locales/en/messages.json
{
  "PageAction_openModebackgroundTab": {
    "message": "Background Tab"
  }
}
```

## 制限事項・注意点

### 1. 完全な互換性は不可能

- Focus関連の動作は異なる挙動となる
- 視覚的フィードバックは利用できない
- 一部のJavaScript APIは制限される

### 2. パフォーマンス考慮

- バックグラウンドタブでの実行は遅くなる可能性
- タイムアウト時間の調整が必要
- 複数のバックグラウンド実行は制限する

### 3. ユーザーエクスペリエンス

- 実行結果の通知方法を工夫する必要
- エラー時の対処方法を明確にする
- プログレス表示の改善が必要

## 実装優先度

### High Priority (必須)

- [ ] OPEN_MODE.BACKGROUND_TAB enum値追加
- [ ] PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB enum値追加
- [ ] BackgroundPageActionDispatcher実装
- [ ] バックグラウンド用要素解決ロジック
- [ ] openAndRun関数でのBACKGROUND_TABモード対応
- [ ] 国際化メッセージ追加

### Medium Priority (推奨)

- [ ] エラーハンドリング強化
- [ ] 通知システム改善
- [ ] パフォーマンス最適化
- [ ] テストケース追加

### Low Priority (将来)

- [ ] バックグラウンド実行の統計取得
- [ ] 高度なエラー回復機能
- [ ] バッチ実行機能

## 結論

PageActionのバックグラウンド実行は**技術的に実現可能**ですが、いくつかの制約があります。段階的なアプローチで実装し、ユーザーには実行モードの選択肢を提供することで、従来の安定性を保ちながら新機能を提供できます。

最初は基本的な操作（click, input）から対応し、動作が安定してから他の操作に拡張することを推奨します。
