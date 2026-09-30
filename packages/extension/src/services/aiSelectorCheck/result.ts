import {
  PAGE_STATE,
  type PageClassification,
  type PageSnapshot,
  type PageState,
} from "./pageState"

/** Which selector list of an AI service a group corresponds to. */
export const SELECTOR_KIND = {
  INPUT: "inputSelectors",
  SUBMIT: "submitSelectors",
} as const
export type SelectorKind = (typeof SELECTOR_KIND)[keyof typeof SELECTOR_KIND]

export type SelectorMatch = {
  selector: string
  found: boolean
  /** The selector is not valid CSS (querySelector throws). */
  invalid?: boolean
}

export type SelectorGroupResult = {
  kind: SelectorKind
  matches: SelectorMatch[]
}

export const VERDICT = {
  /** Every selector group has at least one matching selector. */
  PASS: "pass",
  /** At least one selector group has no matching selector. */
  FAIL: "fail",
  /** The page could not be inspected (bot challenge / login wall). */
  BLOCKED: "blocked",
  /** An unexpected error occurred (navigation timeout, crash, ...). */
  ERROR: "error",
} as const
export type Verdict = (typeof VERDICT)[keyof typeof VERDICT]

export type ServiceCheckResult = {
  id: string
  name: string
  url: string
  finalUrl?: string
  pageState?: PageState
  /** How pageState was decided (set when the input was not found). */
  classification?: PageClassification
  /** Page snapshot, taken only when the input was not found. */
  snapshot?: PageSnapshot
  groups: SelectorGroupResult[]
  verdict: Verdict
  error?: string
}

/**
 * A group passes when any of its selectors matches, because the extension
 * joins each list into a single selector (`a, b, c`) at runtime. For the
 * same reason, a single invalid selector breaks the whole group.
 */
export const isGroupPassed = (group: SelectorGroupResult): boolean =>
  group.matches.length === 0 ||
  (group.matches.some((m) => m.found) && !group.matches.some((m) => m.invalid))

export const decideVerdict = (
  pageState: PageState,
  groups: SelectorGroupResult[],
): Verdict => {
  if (pageState !== PAGE_STATE.OK) return VERDICT.BLOCKED
  return groups.every(isGroupPassed) ? VERDICT.PASS : VERDICT.FAIL
}

const VERDICT_ICON: Record<Verdict, string> = {
  pass: "✅",
  fail: "❌",
  blocked: "⚠️",
  error: "💥",
}

/**
 * Render results as a Markdown report (used for GitHub issues and the
 * workflow job summary).
 */
export const toMarkdown = (results: ServiceCheckResult[]): string => {
  const lines: string[] = [
    "| Service | Verdict | Detail |",
    "| --- | --- | --- |",
  ]
  for (const r of results) {
    const detail =
      r.verdict === VERDICT.BLOCKED
        ? `page state: \`${r.pageState}\` (${r.finalUrl ?? r.url})` +
          (r.classification
            ? ` — ${r.classification.classifiedBy}: ${r.classification.reason.replace(/\|/g, "\\|")}`
            : "")
        : r.verdict === VERDICT.ERROR
          ? (r.error ?? "").replace(/\|/g, "\\|").split("\n")[0]
          : r.groups
              .filter((g) => !isGroupPassed(g))
              .map((g) => `\`${g.kind}\` not found`)
              .join(", ")
    lines.push(
      `| ${r.name} (\`${r.id}\`) | ${VERDICT_ICON[r.verdict]} ${r.verdict} | ${detail} |`,
    )
  }

  const failed = results.filter((r) => r.verdict === VERDICT.FAIL)
  if (failed.length > 0) {
    lines.push("", "### Selector details")
    for (const r of failed) {
      lines.push("", `#### ${r.name} (${r.finalUrl ?? r.url})`)
      for (const g of r.groups) {
        lines.push(`- \`${g.kind}\`${isGroupPassed(g) ? "" : " ❌"}`)
        for (const m of g.matches) {
          const mark = m.invalid ? "⛔ invalid" : m.found ? "✅" : "❌"
          lines.push(`  - ${mark} \`${m.selector}\``)
        }
      }
    }
  }
  return lines.join("\n")
}
