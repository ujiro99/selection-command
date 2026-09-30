import { describe, it, expect } from "vitest"
import { PAGE_STATE } from "../pageState"
import {
  decideVerdict,
  isGroupPassed,
  toMarkdown,
  SELECTOR_KIND,
  VERDICT,
  type SelectorGroupResult,
  type ServiceCheckResult,
} from "../result"

const group = (
  kind: SelectorGroupResult["kind"],
  found: boolean[],
): SelectorGroupResult => ({
  kind,
  matches: found.map((f, i) => ({ selector: `#s${i}`, found: f })),
})

describe("isGroupPassed", () => {
  it("passes when any selector matches", () => {
    expect(isGroupPassed(group(SELECTOR_KIND.INPUT, [false, true]))).toBe(true)
  })

  it("fails when no selector matches", () => {
    expect(isGroupPassed(group(SELECTOR_KIND.INPUT, [false, false]))).toBe(
      false,
    )
  })

  it("passes an empty group (service without selectors)", () => {
    expect(isGroupPassed(group(SELECTOR_KIND.SUBMIT, []))).toBe(true)
  })
})

describe("decideVerdict", () => {
  it("returns blocked when the page is not ok", () => {
    expect(decideVerdict(PAGE_STATE.LOGIN_REQUIRED, [])).toBe(VERDICT.BLOCKED)
  })

  it("returns pass when every group passes", () => {
    expect(
      decideVerdict(PAGE_STATE.OK, [
        group(SELECTOR_KIND.INPUT, [true]),
        group(SELECTOR_KIND.SUBMIT, [false, true]),
      ]),
    ).toBe(VERDICT.PASS)
  })

  it("returns fail when any group fails", () => {
    expect(
      decideVerdict(PAGE_STATE.OK, [
        group(SELECTOR_KIND.INPUT, [true]),
        group(SELECTOR_KIND.SUBMIT, [false]),
      ]),
    ).toBe(VERDICT.FAIL)
  })
})

describe("toMarkdown", () => {
  const results: ServiceCheckResult[] = [
    {
      id: "gemini",
      name: "Gemini",
      url: "https://gemini.google.com/app",
      groups: [group(SELECTOR_KIND.INPUT, [true])],
      verdict: VERDICT.PASS,
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      url: "https://chatgpt.com",
      groups: [
        group(SELECTOR_KIND.INPUT, [false]),
        group(SELECTOR_KIND.SUBMIT, [true]),
      ],
      verdict: VERDICT.FAIL,
    },
    {
      id: "perplexity",
      name: "Perplexity",
      url: "https://www.perplexity.ai",
      pageState: PAGE_STATE.BLOCKED,
      groups: [],
      verdict: VERDICT.BLOCKED,
    },
  ]

  it("renders one table row per service", () => {
    const md = toMarkdown(results)
    expect(md).toContain("| Gemini (`gemini`) | ✅ pass |")
    expect(md).toContain("`inputSelectors` not found")
    expect(md).toContain("page state: `blocked`")
  })

  it("lists selector details only for failed services", () => {
    const md = toMarkdown(results)
    expect(md).toContain("#### ChatGPT")
    expect(md).not.toContain("#### Gemini")
    expect(md).toContain("  - ❌ `#s0`")
  })
})
