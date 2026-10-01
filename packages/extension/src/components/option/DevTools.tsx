import { useState } from "react"
import { ScanSearch, VenetianMask } from "lucide-react"
import { isDevToolsEnabled } from "@/services/aiSelectorCheck/devFlag"
import { runAiSelectorCheck } from "@/services/aiSelectorCheck/runner"

import css from "./Option.module.css"

// Developer-only UI: texts are intentionally not localized.

/**
 * Developer tools menu, shown only when the dev flag is set
 * (see services/aiSelectorCheck/devFlag.ts). Results are logged to the
 * console.
 */
export function DevTools() {
  const [enabled] = useState(isDevToolsEnabled)
  const [running, setRunning] = useState(false)
  if (!enabled) return null

  const run = async (incognito: boolean) => {
    setRunning(true)
    try {
      await runAiSelectorCheck({ incognito })
    } catch (e) {
      console.error("[AI Selector Check]", e)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className={css.menu}>
      <p className={css.menuLabel}>
        <span>Developer Tools</span>
      </p>
      <button
        className={css.menuButton}
        onClick={() => run(false)}
        disabled={running}
        title="Results are logged to the console"
      >
        <ScanSearch size={18} className="mr-2 stroke-gray-600" />
        AI Selector Check
      </button>
      <button
        className={css.menuButton}
        onClick={() => run(true)}
        disabled={running}
        title="Checks in a new incognito window (no login session). Results are logged to the console"
      >
        <VenetianMask size={18} className="mr-2 stroke-gray-600" />
        AI Selector Check (Incognito)
      </button>
      {running && <p className="text-sm text-gray-600 ml-2">Checking…</p>}
    </div>
  )
}
