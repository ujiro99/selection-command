export const ENV_PROBE_TARGET = "offscreen-environment"

export type EnvironmentProbeResult = {
  webdriver: boolean | null
  webglRenderer: string | null
}

/** Read the WebGL renderer, preferring the unmasked name when available. */
export function readWebglRenderer(): string | null {
  try {
    const canvas = document.createElement("canvas")
    const gl = (canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    if (!gl) return null
    const ext = gl.getExtension("WEBGL_debug_renderer_info")
    const renderer = gl.getParameter(
      ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER,
    )
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return typeof renderer === "string" && renderer ? renderer : null
  } catch {
    return null
  }
}

export function probeEnvironment(): EnvironmentProbeResult {
  return {
    webdriver:
      typeof navigator.webdriver === "boolean" ? navigator.webdriver : null,
    webglRenderer: readWebglRenderer(),
  }
}

/**
 * Answer environment probe requests from the service worker. Registered in
 * every offscreen document, because only one can exist at a time and the
 * probe must work even when another one is already open.
 */
export function registerEnvironmentProbeListener(): void {
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (
      sender.id !== chrome.runtime.id ||
      sender.tab ||
      message?.target !== ENV_PROBE_TARGET
    ) {
      return false
    }
    respond(probeEnvironment())
    return false
  })
}
