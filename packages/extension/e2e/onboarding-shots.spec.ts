import { test, chromium } from "@playwright/test"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { OnboardingStep, StepPhase } from "@/types/onboarding"

// Not part of the regular e2e suite - a design-review tool. Skipped unless
// explicitly requested (`CAPTURE=1 yarn test:e2e onboarding-shots`) so it
// never slows down or flakes the normal CI run.
//
// Uses `?step=..&phase=..` (see useOnboardingState.ts's readE2eOverride(),
// e2e-build only) to land directly on each screen instead of driving the
// real selection/command flow, and launches its own persistent context per
// locale (rather than the shared `fixtures.ts` one) so this file alone
// controls `--lang`.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pathToExtension = path.join(__dirname, "../dist")

type Shot = {
  name: string
  step: keyof typeof OnboardingStep
  phase?: StepPhase
}

// One shot per visually distinct screen - not one per StepPhase transition;
// e.g. Step2's WAIT_EXECUTE looks like Step1's, so only Step1 gets it.
const SHOTS: Shot[] = [
  { name: "00-intro", step: "INTRO" },
  { name: "01-search-explain", step: "SEARCH", phase: StepPhase.EXPLAIN },
  {
    name: "02-search-wait-execute",
    step: "SEARCH",
    phase: StepPhase.WAIT_EXECUTE,
  },
  {
    name: "03-search-wait-return",
    step: "SEARCH",
    phase: StepPhase.WAIT_RETURN,
  },
  { name: "04-search-value", step: "SEARCH", phase: StepPhase.VALUE_SHOWN },
  { name: "05-ai-explain", step: "AI_PROMPT", phase: StepPhase.EXPLAIN },
  { name: "06-ai-value", step: "AI_PROMPT", phase: StepPhase.VALUE_SHOWN },
  {
    name: "07-preview-explain",
    step: "LINK_PREVIEW",
    phase: StepPhase.EXPLAIN,
  },
  {
    name: "08-preview-value",
    step: "LINK_PREVIEW",
    phase: StepPhase.VALUE_SHOWN,
  },
  { name: "09-customize", step: "CUSTOMIZE" },
  { name: "10-complete", step: "COMPLETE" },
]

const LOCALES = ["ja", "en-US", "de"]

test.describe("onboarding screenshots (design review)", () => {
  test.skip(
    !process.env.CAPTURE,
    "set CAPTURE=1 to run onboarding screenshot capture",
  )

  for (const locale of LOCALES) {
    test(`capture (${locale})`, async () => {
      test.setTimeout(120_000)

      const context = await chromium.launchPersistentContext("", {
        headless: false,
        args: [
          "--headless=new",
          `--lang=${locale}`,
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
        ],
      })

      try {
        let [sw] = context.serviceWorkers()
        if (!sw) sw = await context.waitForEvent("serviceworker")
        const extensionId = sw.url().split("/")[2]

        const page = await context.newPage()
        const outDir = path.join(
          __dirname,
          "../test-results/onboarding",
          locale,
        )
        fs.mkdirSync(outDir, { recursive: true })

        for (const shot of SHOTS) {
          const params = new URLSearchParams({ step: shot.step })
          if (shot.phase) params.set("phase", shot.phase)
          await page.goto(
            `chrome-extension://${extensionId}/src/onboarding_page.html?${params}`,
          )
          // Let entrance animations and the selection-demo cursor settle
          // into a representative frame before capturing.
          await page.waitForTimeout(700)
          await page.screenshot({ path: path.join(outDir, `${shot.name}.png`) })
        }
      } finally {
        await context.close()
      }
    })
  }
})
