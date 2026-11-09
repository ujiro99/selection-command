import {
  ENV_PROBE_TARGET,
  type EnvironmentProbeResult,
} from "./offscreenEnvironmentProbe"

const DOCUMENT_PATH = "src/offscreen_environment.html"
const PROBE_TIMEOUT_MS = 3000
// GA4 caps event parameter values at 100 characters.
const MAX_PARAM_LENGTH = 100
const UNKNOWN = "unknown"

export type InstallEnvironmentParams = {
  install_type: string
  user_agent_1: string
  user_agent_2?: string
  is_webdriver: string
  webgl_renderer: string
}

const isProbeResult = (value: unknown): value is EnvironmentProbeResult =>
  typeof value === "object" &&
  value !== null &&
  "webdriver" in value &&
  "webglRenderer" in value

/**
 * Split the user agent at fixed positions so the analysis side can join the
 * two parameters back into the original string.
 */
export function splitUserAgent(
  userAgent: string,
): Pick<InstallEnvironmentParams, "user_agent_1" | "user_agent_2"> {
  const first = userAgent.slice(0, MAX_PARAM_LENGTH)
  const second = userAgent.slice(MAX_PARAM_LENGTH, MAX_PARAM_LENGTH * 2)
  return {
    user_agent_1: first || UNKNOWN,
    ...(second ? { user_agent_2: second } : {}),
  }
}

async function getInstallType(): Promise<string> {
  try {
    const self = await chrome.management.getSelf()
    return self.installType || UNKNOWN
  } catch {
    return UNKNOWN
  }
}

/**
 * Read navigator.webdriver and the WebGL renderer in an offscreen document,
 * since neither is available in a service worker. The document is closed
 * right after, unless it was already open for another purpose.
 */
async function probeInOffscreenDocument(): Promise<EnvironmentProbeResult | null> {
  let created = false
  try {
    try {
      await chrome.offscreen.createDocument({
        url: DOCUMENT_PATH,
        reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
        justification:
          "Read navigator.webdriver and the WebGL renderer, which are not available in a service worker",
      })
      created = true
    } catch (error) {
      // Another offscreen document (e.g. the clipboard one) is open; it also
      // answers the probe, so ask it instead.
      const message = error instanceof Error ? error.message : String(error)
      if (!/single offscreen document/i.test(message)) throw error
    }
    const result: unknown = await chrome.runtime.sendMessage({
      target: ENV_PROBE_TARGET,
    })
    return isProbeResult(result) ? result : null
  } catch (error) {
    console.warn("Failed to probe the environment:", error)
    return null
  } finally {
    if (created) {
      chrome.offscreen.closeDocument().catch(() => undefined)
    }
  }
}

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T) =>
  new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise
      .then(resolve, () => resolve(fallback))
      .finally(() => clearTimeout(timer))
  })

/**
 * Signals recorded on install to tell automated environments (AI agents,
 * bots, headless browsers) apart from people (#550). Never rejects; values
 * that cannot be read within the timeout are reported as "unknown".
 */
export async function getInstallEnvironmentParams(): Promise<InstallEnvironmentParams> {
  const [installType, probe] = await Promise.all([
    withTimeout(getInstallType(), PROBE_TIMEOUT_MS, UNKNOWN),
    withTimeout(probeInOffscreenDocument(), PROBE_TIMEOUT_MS, null),
  ])
  return {
    install_type: installType,
    ...splitUserAgent(globalThis.navigator?.userAgent ?? ""),
    is_webdriver: probe?.webdriver == null ? UNKNOWN : String(probe.webdriver),
    webgl_renderer: (probe?.webglRenderer || UNKNOWN).slice(
      0,
      MAX_PARAM_LENGTH,
    ),
  }
}
