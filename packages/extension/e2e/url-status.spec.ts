import { test, expect } from "@playwright/test"
import { COMMAND_URLS } from "./generated-command-urls"

/**
 * E2E tests to verify that all search URLs used in default commands
 * across all supported locales are accessible and return HTTP 200.
 *
 * URL list is auto-generated from defaultSettings.ts.
 * Run "yarn build:e2e" to regenerate e2e/generated-command-urls.ts.
 * The %s placeholder is replaced with "test" for each request.
 */

test.describe("E2E-URL: Default command URLs return HTTP 200", () => {
  test.skip(!!process.env.CI, "Do not run tests for external services in CI.")

  for (const { title, locale, searchUrl } of COMMAND_URLS) {
    const url = searchUrl.replace("%s", "test")
    test(`${title} (${locale}): ${url}`, async ({ request }) => {
      const response = await request.get(url, { timeout: 30_000 })
      expect(
        response.status(),
        `Expected HTTP 200 for ${url}, got ${response.status()}`,
      ).toBe(200)
    })
  }
})
