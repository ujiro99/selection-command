# Plan: New Hub (selection-command-hub) へのコマンド投稿機能

## Context

Selection Command Hub の新バージョン（`https://selection-command-hub.pages.dev`）が公開された。
旧 Hub（GitHub Pages の静的サイト）では Google Apps Script エンドポイントへ POST していたが、
新 Hub は Supabase + Server Action をバックエンドに持ち、
Chrome 拡張から `window.postMessage` でコマンドデータを送信する新しいプロトコルを採用している。

**やること**: 拡張機能のオプションページのコマンド一覧に「Hub へ共有」ボタンを追加し、
新 Hub の postMessage プロトコルでコマンドを投稿できるようにする。

旧 Hub との連携（ダウンロード機能 / MyCommands UI の注入）はそのまま維持する。

---

## 新しい共有フロー

```
[オプションページ] ShareButton クリック
  → window.open(NEW_HUB_URL/lang, "_blank")  ← オプションページのJSコンテキストから直接実行
  → setInterval でリトライしながら hubWindow.postMessage({ type: "share-command", command }, hubOrigin)
  → Hub ページが ConfirmForm ダイアログを表示
  → ユーザーが「投稿」クリック → Hub の Server Action が Supabase に保存
```

> **Note**: Chrome 拡張のオプションページ（`chrome-extension://…`）は通常の Web ページとして動作するため、
> `window.open` でタブを開き、返された window 参照に対して `postMessage` を送信できる。
> バックグラウンドスクリプトや追加のコンテントスクリプトは不要。

---

## 変更ファイル一覧

| 操作 | ファイル                                                                  | 内容                     |
| ---- | ------------------------------------------------------------------------- | ------------------------ |
| 修正 | `packages/extension/src/const.ts`                                         | `NEW_HUB_URL` 定数を追加 |
| 新規 | `packages/extension/src/services/hubShare.ts`                             | 共有ロジック一式         |
| 新規 | `packages/extension/src/components/option/ShareButton.tsx`                | 共有ボタン UI            |
| 修正 | `packages/extension/src/components/option/editor/CommandTreeRenderer.tsx` | ShareButton を追加       |
| 修正 | `packages/extension/public/_locales/*/messages.json`                      | i18n キー追加（15言語）  |

---

## 詳細設計

### 0. `.env` への追加

`VITE_` プレフィックスを使い、Vite が自動的に `import.meta.env` に注入する形式を採用（既存の `VITE_MEASUREMENT_ID` 等と同じパターン）。

**`packages/extension/.env`**:

```
VITE_NEW_HUB_URL=https://selection-command-hub.pages.dev
```

開発環境向けに `.env.development` を作成:

```
VITE_NEW_HUB_URL=http://localhost:3001
```

---

### 1. `const.ts` への追加

```typescript
// packages/extension/src/const.ts（HUB_URL の直後に追加）

export const NEW_HUB_URL =
  import.meta.env.VITE_NEW_HUB_URL ?? "https://selection-command-hub.pages.dev"

// Hub がサポートする言語コード
export const NEW_HUB_SUPPORTED_LOCALES = [
  "ja",
  "en",
  "ko",
  "zh-CN",
  "de",
  "es",
  "fr",
  "hi",
  "id",
  "it",
  "ms",
  "pt-BR",
  "pt-PT",
  "ru",
] as const

export type NewHubLocale = (typeof NEW_HUB_SUPPORTED_LOCALES)[number]

// 新 Hub に投稿できる openMode（それ以外は「共有」ボタン非表示）
export const NEW_HUB_SHAREABLE_OPEN_MODES: ReadonlySet<string> = new Set([
  OPEN_MODE.POPUP,
  OPEN_MODE.TAB,
  OPEN_MODE.WINDOW,
  OPEN_MODE.BACKGROUND_TAB,
  OPEN_MODE.SIDE_PANEL,
  OPEN_MODE.PAGE_ACTION,
  OPEN_MODE.AI_PROMPT, // 意図的なスコープ拡張: AiPrompt コマンドも Hub に共有可能
])
```

---

### 2. `services/hubShare.ts`（新規）

```typescript
// packages/extension/src/services/hubShare.ts

import {
  NEW_HUB_URL,
  NEW_HUB_SUPPORTED_LOCALES,
  OPEN_MODE,
  type NewHubLocale,
} from "@/const"
import type {
  SelectionCommand,
  SearchCommand,
  PageActionCommand,
} from "@/types"

// ---- 型定義 ---------------------------------------------------------------

export interface SubmitCommandInput {
  title: string
  description?: string
  iconUrl?: string
  openMode: string
  commandData: Record<string, unknown>
  locale?: string
  tags?: string[]
}

// ---- ロケール解決 ----------------------------------------------------------

export function getHubLocale(): NewHubLocale {
  const lang = (
    chrome.i18n.getUILanguage() ??
    navigator.language ??
    "en"
  ).toLowerCase()

  // 完全一致
  for (const locale of NEW_HUB_SUPPORTED_LOCALES) {
    if (lang === locale.toLowerCase()) return locale
  }
  // 前方一致（例: "zh-tw" → "zh-CN"、"pt-br" → "pt-BR"）
  for (const locale of NEW_HUB_SUPPORTED_LOCALES) {
    if (lang.startsWith(locale.split("-")[0].toLowerCase())) return locale
  }
  return "en"
}

// ---- コマンドデータ変換 ----------------------------------------------------

export function toSubmitCommandInput(
  cmd: SelectionCommand,
): SubmitCommandInput | null {
  const { title, iconUrl, openMode } = cmd

  if (openMode === OPEN_MODE.PAGE_ACTION) {
    const pa = cmd as PageActionCommand
    return {
      title,
      iconUrl: iconUrl || undefined,
      openMode,
      commandData: {
        steps: pa.pageActionOption.steps,
        startUrl: pa.pageActionOption.startUrl,
        openMode: pa.pageActionOption.openMode,
      },
      locale: getHubLocale(),
    }
  }

  // Search 系（popup / tab / window / backgroundTab / sidePanel）
  const sc = cmd as SearchCommand
  if (!sc.searchUrl) return null

  const commandData: Record<string, unknown> = { searchUrl: sc.searchUrl }
  if (sc.openModeSecondary) commandData.openModeSecondary = sc.openModeSecondary
  if (sc.spaceEncoding) commandData.spaceEncoding = sc.spaceEncoding

  return {
    title,
    iconUrl: iconUrl || undefined,
    openMode,
    commandData,
    locale: getHubLocale(),
  }
}

// ---- 共有メイン処理 --------------------------------------------------------

const RETRY_INTERVAL_MS = 500
const MAX_RETRIES = 20 // 10秒

export function shareCommandToHub(command: SelectionCommand): boolean {
  const input = toSubmitCommandInput(command)
  if (!input) return false

  const locale = getHubLocale()
  const hubUrl = `${NEW_HUB_URL}/${locale}`

  const hubWindow = window.open(hubUrl, "_blank")
  if (!hubWindow) {
    console.error("[HubShare] Failed to open Hub page.")
    return false
  }

  let retries = 0
  const timer = setInterval(() => {
    retries++
    if (retries > MAX_RETRIES) {
      clearInterval(timer)
      console.error("[HubShare] Hub page did not respond in time.")
      return
    }
    try {
      hubWindow.postMessage(
        { type: "share-command", command: input },
        NEW_HUB_URL,
      )
      clearInterval(timer)
    } catch {
      // hub ウィンドウがまだロード中 → 次のリトライへ
    }
  }, RETRY_INTERVAL_MS)

  return true
}
```

> **注意**: `postMessage` の `targetOrigin` は `NEW_HUB_URL`（`https://selection-command-hub.pages.dev`）を指定し、
> `"*"` は使用しない（API 仕様のセキュリティ要件）。

---

### 3. `ShareButton.tsx`（新規）

`EditButton` / `RemoveButton` と同じパターンで実装する。

```typescript
// packages/extension/src/components/option/ShareButton.tsx

import { useState } from "react"
import { Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/services/i18n"
import { shareCommandToHub } from "@/services/hubShare"
import type { SelectionCommand } from "@/types"

type Props = {
  command: SelectionCommand
}

export const ShareButton = ({ command }: Props) => {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle")

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = shareCommandToHub(command)
    setStatus(ok ? "sent" : "error")
    setTimeout(() => setStatus("idle"), 2000)
  }

  return (
    <button
      type="button"
      title={t("Option_shareButton_tooltip")}
      className={cn(
        "outline-gray-200 p-2 rounded-md transition hover:bg-green-100 hover:scale-125 group/share-btn",
      )}
      onClick={handleClick}
    >
      <Share2
        className={cn(
          "stroke-gray-500 group-hover/share-btn:stroke-green-600",
          status === "sent" && "stroke-green-600",
          status === "error" && "stroke-red-500",
        )}
        size={16}
      />
    </button>
  )
}
```

---

### 4. `CommandTreeRenderer.tsx` の修正

差分:

```diff
+ import { ShareButton } from "@/components/option/ShareButton"
+ import { NEW_HUB_SHAREABLE_OPEN_MODES } from "@/const"

  <div className="flex gap-0.5 items-center">
+   {isCommand(field.content) &&
+     NEW_HUB_SHAREABLE_OPEN_MODES.has(field.content.openMode) && (
+     <ShareButton command={field.content} />
+   )}
    {isPageActionCommand(field.content) && (
```

変更点はこれだけ。Props の追加や CommandList.tsx への変更は不要（ShareButton が自己完結）。

---

### 5. i18n キーの追加

**15言語** の `messages.json` に以下を追加:

```json
"Option_shareButton_tooltip": {
  "message": "Share to Hub"
}
```

対象ファイル: `packages/extension/public/_locales/{en,ja,ko,zh_CN,de,es,fr,hi,id,it,ms,pt_BR,pt_PT,ru,…}/messages.json`

日本語（`ja`）: `"Hubに共有"`

---

## ダウンロード記録 API について

`POST /api/commands/{commandId}/download` は新 Hub の**フロントエンド側**が内部的に呼び出すもので、
拡張機能から呼び出す必要はない（今回のスコープ外）。

---

## 検証方法

1. `pnpm dev` で拡張機能を開発ビルド（`isDebug=true` → `NEW_HUB_URL=http://localhost:3001`）
2. Chrome で拡張機能のオプションページを開く
3. 検索コマンドの行に Share2 アイコンが表示されることを確認
4. ボタンをクリック → 新 Hub のタブが開くことを確認
5. Hub の ConfirmForm ダイアログが表示され、コマンドデータが入力済みであることを確認
6. PageAction コマンドでも同様に確認
7. API / aiPrompt / copy などの unsupported コマンドには Share ボタンが表示されないことを確認
