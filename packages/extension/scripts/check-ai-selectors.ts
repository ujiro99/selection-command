#!/usr/bin/env vite-node
/**
 * Checks that the selectors in hub/public/data/ai-services.json still match
 * the live AI service pages.
 *
 * For each service:
 *   1. Open `url` and wait for any of `inputSelectors`.
 *   2. Type a dummy text (never submitted) and check `submitSelectors`,
 *      since submit buttons usually appear / enable only after input.
 *   3. When the input was not found, classify the page (ok / blocked /
 *      login_required) with Gemini from its text and screenshot, so that a
 *      challenge or login page is not reported as a broken selector.
 *      Set GEMINI_API_KEY to enable it; rule-based otherwise.
 *
 * `copySelectors` are not checked because they only appear after a response
 * has been generated, which requires actually sending a prompt.
 *
 * Outputs (under OUT_DIR):
 *   - result.json   : raw results
 *   - summary.md    : Markdown report
 *   - <id>.png      : screenshot of each page
 * When running on GitHub Actions, `broken` / `blocked` flags are also written
 * to $GITHUB_OUTPUT.
 *
 * Usage: yarn check:ai-selectors [--only=gemini,chatgpt] [--headless]
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { chromium, type Page } from "@playwright/test"
import {
  CHALLENGE_SELECTORS,
  detectPageStateByRules,
  PAGE_STATE,
  SNAPSHOT_TEXT_LENGTH,
  takePageSnapshot,
} from "@/services/aiSelectorCheck/pageState"
import { classifyResult } from "@/services/aiSelectorCheck/geminiClassifier"
import {
  decideVerdict,
  toMarkdown,
  SELECTOR_KIND,
  VERDICT,
  type SelectorGroupResult,
  type ServiceCheckResult,
} from "@/services/aiSelectorCheck/result"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AI_SERVICES_PATH = path.resolve(
  __dirname,
  "../../hub/public/data/ai-services.json",
)
const OUT_DIR = path.resolve(__dirname, "../selector-check-results")

/**
 * Services excluded from the CI check.
 * - claude: redirects to a login page when not signed in.
 */
const EXCLUDED_SERVICE_IDS = ["claude"]

const NAVIGATION_TIMEOUT_MS = 30_000
const INPUT_TIMEOUT_MS = 15_000
const SUBMIT_TIMEOUT_MS = 5_000
const DUMMY_TEXT = "selector check"

type AiServiceJson = {
  id: string
  name: string
  url: string
  inputSelectors?: string[]
  submitSelectors?: string[]
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  const only = args
    .find((a) => a.startsWith("--only="))
    ?.slice("--only=".length)
    .split(",")
  return { only, headless: args.includes("--headless") }
}

/**
 * Wait until any selector of the list matches.
 * document.querySelector is used instead of Playwright locators so that the
 * selectors are evaluated exactly as the extension does at runtime (the
 * list joined into `a, b, c`).
 */
const waitForAny = async (
  page: Page,
  selectors: string[],
  timeout: number,
): Promise<boolean> => {
  if (selectors.length === 0) return false
  try {
    await page.waitForFunction(
      (sels) => {
        try {
          return document.querySelector(sels.join(", ")) != null
        } catch {
          return false
        }
      },
      selectors,
      { timeout, polling: 500 },
    )
    return true
  } catch {
    return false
  }
}

const matchEach = (
  page: Page,
  selectors: string[],
): Promise<SelectorGroupResult["matches"]> =>
  page.evaluate(
    (sels) =>
      sels.map((selector) => {
        try {
          return { selector, found: document.querySelector(selector) != null }
        } catch {
          return { selector, found: false, invalid: true }
        }
      }),
    selectors,
  )

const checkService = async (
  page: Page,
  service: AiServiceJson,
): Promise<ServiceCheckResult> => {
  const base = { id: service.id, name: service.name, url: service.url }
  const inputSelectors = service.inputSelectors ?? []
  const submitSelectors = service.submitSelectors ?? []

  await page.goto(service.url, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT_MS,
  })

  // Give the SPA a chance to render the composer before judging.
  const inputFound = await waitForAny(page, inputSelectors, INPUT_TIMEOUT_MS)

  if (inputFound) {
    // Type into the input so that the submit button appears.
    await page.evaluate(
      (sel) => (document.querySelector(sel) as HTMLElement | null)?.focus(),
      inputSelectors.join(", "),
    )
    await page.keyboard.type(DUMMY_TEXT)
    await waitForAny(page, submitSelectors, SUBMIT_TIMEOUT_MS)
  }

  const groups: SelectorGroupResult[] = [
    {
      kind: SELECTOR_KIND.INPUT,
      matches: await matchEach(page, inputSelectors),
    },
    {
      kind: SELECTOR_KIND.SUBMIT,
      matches: await matchEach(page, submitSelectors),
    },
  ]

  if (inputFound) {
    return {
      ...base,
      finalUrl: page.url(),
      pageState: PAGE_STATE.OK,
      groups,
      verdict: decideVerdict(PAGE_STATE.OK, groups),
    }
  }

  // The input was not found: classify the page to tell a broken selector
  // from a challenge / login page.
  const snapshot = await page.evaluate(takePageSnapshot, {
    challengeSelectors: CHALLENGE_SELECTORS,
    textLength: SNAPSHOT_TEXT_LENGTH,
  })
  const pageState = detectPageStateByRules(snapshot)
  return classifyResult(
    {
      ...base,
      finalUrl: page.url(),
      pageState,
      snapshot,
      groups,
      verdict: decideVerdict(pageState, groups),
    },
    {
      apiKey: process.env.GEMINI_API_KEY,
      screenshot: {
        mimeType: "image/png",
        data: (await page.screenshot()).toString("base64"),
      },
    },
  )
}

const writeGithubOutput = (results: ServiceCheckResult[]) => {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) return
  const has = (...verdicts: string[]) =>
    results.some((r) => verdicts.includes(r.verdict))
  fs.appendFileSync(
    outputPath,
    [
      `broken=${has(VERDICT.FAIL)}`,
      `blocked=${has(VERDICT.BLOCKED, VERDICT.ERROR)}`,
      `broken_services=${results
        .filter((r) => r.verdict === VERDICT.FAIL)
        .map((r) => r.id)
        .join(",")}`,
      "",
    ].join("\n"),
  )
}

const main = async () => {
  const { only, headless } = parseArgs()
  console.log(
    `Page classification: ${process.env.GEMINI_API_KEY ? "Gemini" : "rules (set GEMINI_API_KEY to use Gemini)"}`,
  )
  const services = (
    JSON.parse(fs.readFileSync(AI_SERVICES_PATH, "utf-8")) as AiServiceJson[]
  ).filter((s) =>
    only ? only.includes(s.id) : !EXCLUDED_SERVICE_IDS.includes(s.id),
  )

  fs.rmSync(OUT_DIR, { recursive: true, force: true })
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // Headed mode (under xvfb on CI) is less likely to trigger bot challenges.
  const browser = await chromium.launch({
    headless,
    // "chromium" channel uses the new headless mode (full browser), which is
    // harder to tell apart from a normal browser than headless shell.
    channel: "chromium",
    args: ["--disable-blink-features=AutomationControlled"],
  })
  // Headless Chromium advertises "HeadlessChrome" in its UA, which bot
  // protection (e.g. Cloudflare) blocks outright.
  const userAgent = browser.version()
    ? `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`
    : undefined
  const context = await browser.newContext({
    userAgent,
    locale: "en-US",
    viewport: { width: 1280, height: 900 },
  })

  const results: ServiceCheckResult[] = []
  for (const service of services) {
    const page = await context.newPage()
    let result: ServiceCheckResult
    try {
      result = await checkService(page, service)
    } catch (e) {
      result = {
        id: service.id,
        name: service.name,
        url: service.url,
        finalUrl: page.url(),
        groups: [],
        verdict: VERDICT.ERROR,
        error: e instanceof Error ? e.message : String(e),
      }
    }
    await page
      .screenshot({ path: path.join(OUT_DIR, `${service.id}.png`) })
      .catch(() => {})
    await page.close()
    console.log(`[${result.verdict}] ${service.name}`)
    results.push(result)
  }
  await browser.close()

  const markdown = toMarkdown(results)
  fs.writeFileSync(
    path.join(OUT_DIR, "result.json"),
    JSON.stringify(results, null, 2),
  )
  fs.writeFileSync(path.join(OUT_DIR, "summary.md"), markdown + "\n")
  console.log("\n" + markdown)
  writeGithubOutput(results)

  // On GitHub Actions the workflow decides how to notify from $GITHUB_OUTPUT,
  // so the exit code is only used for local runs.
  if (
    !process.env.GITHUB_ACTIONS &&
    results.some((r) => r.verdict !== VERDICT.PASS)
  )
    process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
