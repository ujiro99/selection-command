import type { BrowserContext } from "@playwright/test"

const DEPLOYED_HUB_ORIGIN = "https://ujiro99.github.io"
const DEPLOYED_HUB_BASE_PATH = "/selection-command"

/**
 * Redirects requests for the deployed hub (GitHub Pages) to a locally served
 * hub build, so that hub changes can be verified with e2e before deploying.
 *
 * Enabled only when E2E_HUB_BASE_URL is set (e.g. "http://localhost:3100"),
 * pointing at a static server for `packages/hub/out`.
 * The local build has no basePath, so both "/selection-command/*" pages and
 * the root-relative "/_next/*" assets they reference are mapped to the
 * server root. Extensionless paths are mapped to their exported ".html" file.
 */
export async function routeHubToLocal(context: BrowserContext): Promise<void> {
  const localBaseUrl = process.env.E2E_HUB_BASE_URL
  if (!localBaseUrl) return

  await context.route(`${DEPLOYED_HUB_ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url())
    let pathname = url.pathname
    if (pathname.startsWith(DEPLOYED_HUB_BASE_PATH)) {
      pathname = pathname.slice(DEPLOYED_HUB_BASE_PATH.length) || "/"
    }
    if (!/\.[a-z0-9]+$/i.test(pathname)) {
      pathname = `${pathname.replace(/\/$/, "/index")}.html`
    }
    const response = await route.fetch({
      url: `${localBaseUrl}${pathname}${url.search}`,
    })
    await route.fulfill({ response })
  })
}
