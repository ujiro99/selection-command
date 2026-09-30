import { useState } from "react"
import { ScanSearch } from "lucide-react"
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

  const run = async () => {
    setRunning(true)
    try {
      await runAiSelectorCheck()
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
        onClick={run}
        disabled={running}
        title="Results are logged to the console"
      >
        <ScanSearch size={18} className="mr-2 stroke-gray-600" />
        {running ? "Checking…" : "AI Selector Check"}
      </button>
    </div>
  )
}
