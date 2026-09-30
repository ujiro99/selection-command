import { useState } from "react"
import { ScanSearch } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { isDevToolsEnabled } from "@/services/aiSelectorCheck/devFlag"
import {
  isGroupPassed,
  toMarkdown,
  VERDICT,
  type Verdict,
} from "@/services/aiSelectorCheck/result"
import {
  loadServices,
  runAiSelectorCheck,
  SERVICE_SOURCE,
  type ServiceSource,
  type TabCheckResult,
} from "@/services/aiSelectorCheck/runner"
import type { AiService } from "@/types"

import css from "./Option.module.css"
import dialogCss from "./Dialog.module.css"

// Developer-only UI: texts are intentionally not localized.

const VERDICT_LABEL: Record<Verdict, string> = {
  pass: "✅ pass",
  fail: "❌ fail",
  blocked: "⚠️ blocked",
  error: "💥 error",
}

type Row = { service: AiService; result?: TabCheckResult }

const focusTab = (tabId?: number) => {
  if (tabId == null) return
  chrome.tabs.update(tabId, { active: true }).catch(() => {})
}

function ResultDetail({ result }: { result: TabCheckResult }) {
  if (result.verdict === VERDICT.BLOCKED) {
    return <span>page state: {result.pageState}</span>
  }
  if (result.verdict === VERDICT.ERROR) {
    return <span className="text-red-700">{result.error}</span>
  }
  return (
    <details open={result.verdict === VERDICT.FAIL}>
      <summary className="cursor-pointer">selectors</summary>
      {result.groups.map((g) => (
        <div key={g.kind} className="mt-1">
          <p className={cn(!isGroupPassed(g) && "text-red-700 font-bold")}>
            {g.kind}
          </p>
          <ul className="ml-3">
            {g.matches.map((m) => (
              <li key={m.selector} className="font-mono text-xs break-all">
                {m.invalid ? "⛔" : m.found ? "✅" : "❌"} {m.selector}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </details>
  )
}

function AiSelectorCheckDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [source, setSource] = useState<ServiceSource>(SERVICE_SOURCE.HUB)
  const [rows, setRows] = useState<Row[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string>()

  const results = rows.flatMap((r) => (r.result ? [r.result] : []))

  const run = async () => {
    setError(undefined)
    setRunning(true)
    try {
      const services = await loadServices(source)
      setRows(services.map((service) => ({ service })))
      await runAiSelectorCheck(services, (result) => {
        setRows((prev) =>
          prev.map((r) => (r.service.id === result.id ? { ...r, result } : r)),
        )
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  const closeTabs = async () => {
    const tabIds = results.flatMap((r) => (r.tabId != null ? [r.tabId] : []))
    await chrome.tabs.remove(tabIds).catch(() => {})
    setRows((prev) =>
      prev.map((r) =>
        r.result ? { ...r, result: { ...r.result, tabId: undefined } } : r,
      ),
    )
  }

  const copyMarkdown = () => {
    navigator.clipboard.writeText(toMarkdown(results)).catch(() => {})
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPortal portal={true}>
        <DialogContent className={cn(dialogCss.dialog, "max-w-4xl")}>
          <DialogHeader>
            <DialogTitle className={dialogCss.title}>
              AI Selector Check
            </DialogTitle>
            <DialogDescription className={dialogCss.description}>
              Opens every AI service in a background tab and checks
              inputSelectors / submitSelectors in your signed-in browser. A
              dummy text may be typed into an empty composer temporarily; it is
              never submitted.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <label className="text-sm">
              ai-services.json:{" "}
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as ServiceSource)}
                disabled={running}
                className="border rounded px-1"
              >
                <option value={SERVICE_SOURCE.HUB}>Hub (latest)</option>
                <option value={SERVICE_SOURCE.BUNDLED}>
                  Bundled (build time)
                </option>
              </select>
            </label>
            {error && <span className="text-sm text-red-700">{error}</span>}
          </div>

          {rows.length > 0 && (
            <div className="max-h-[55vh] overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-1 pr-3">Service</th>
                    <th className="py-1 pr-3 whitespace-nowrap">Verdict</th>
                    <th className="py-1">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ service, result }) => (
                    <tr key={service.id} className="border-b align-top">
                      <td className="py-1 pr-3 whitespace-nowrap">
                        {result?.tabId != null ? (
                          <button
                            className="underline"
                            onClick={() => focusTab(result.tabId)}
                          >
                            {service.name}
                          </button>
                        ) : (
                          service.name
                        )}
                      </td>
                      <td className="py-1 pr-3 whitespace-nowrap">
                        {result ? VERDICT_LABEL[result.verdict] : "checking…"}
                      </td>
                      <td className="py-1">
                        {result && <ResultDetail result={result} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <button
              className={cn(dialogCss.button, "disabled:opacity-50")}
              onClick={run}
              disabled={running}
            >
              {running ? "Checking…" : "Run check"}
            </button>
            <button
              className={cn(dialogCss.buttonCancel, "disabled:opacity-50")}
              onClick={copyMarkdown}
              disabled={running || results.length === 0}
            >
              Copy as Markdown
            </button>
            <button
              className={cn(dialogCss.buttonCancel, "disabled:opacity-50")}
              onClick={closeTabs}
              disabled={running || !results.some((r) => r.tabId != null)}
            >
              Close tabs
            </button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

/**
 * Developer tools menu, shown only when the dev flag is set
 * (see services/aiSelectorCheck/devFlag.ts).
 */
export function DevTools() {
  const [enabled] = useState(isDevToolsEnabled)
  const [open, setOpen] = useState(false)
  if (!enabled) return null

  return (
    <div className={css.menu}>
      <p className={css.menuLabel}>
        <span>Developer Tools</span>
      </p>
      <button className={css.menuButton} onClick={() => setOpen(true)}>
        <ScanSearch size={18} className="mr-2 stroke-gray-600" />
        AI Selector Check
      </button>
      <AiSelectorCheckDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
