import { useEffect, useState } from "react"
import { Ipc, TabCommand } from "@/services/ipc"
import type { ZoomChangedProps } from "@/services/ipc"

/**
 * Tracks the browser zoom factor of the current tab (1 = 100%).
 * Returns 1 while disabled, so callers can pass a setting straight through.
 *
 * The content script cannot tell the browser zoom apart from the OS display
 * scale (both are in `devicePixelRatio`), so the factor comes from the
 * service worker via `chrome.tabs.getZoom` and `chrome.tabs.onZoomChange`.
 */
export function usePageZoom(enabled: boolean): number {
  const [zoomFactor, setZoomFactor] = useState(1)

  useEffect(() => {
    if (!enabled) {
      setZoomFactor(1)
      return
    }

    let disposed = false
    Ipc.getZoom()
      .then((factor) => {
        if (!disposed && typeof factor === "number" && factor > 0) {
          setZoomFactor(factor)
        }
      })
      .catch((error) => console.warn("Failed to get zoom:", error))

    Ipc.addListener<ZoomChangedProps>(
      TabCommand.zoomChanged,
      (param, _sender, response) => {
        if (param.zoomFactor > 0) setZoomFactor(param.zoomFactor)
        response(true)
        return false
      },
    )
    return () => {
      disposed = true
      Ipc.removeListener(TabCommand.zoomChanged)
    }
  }, [enabled])

  return enabled ? zoomFactor : 1
}
