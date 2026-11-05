import { createContext, useContext, useEffect, useState } from "react"
import { Ipc, TabCommand } from "@/services/ipc"
import type { ZoomChangedProps } from "@/services/ipc"

/**
 * Tracks the browser zoom factor of the current tab (1 = 100%).
 * Returns 1 while disabled, so callers can pass a setting straight through.
 *
 * The content script cannot tell the browser zoom apart from the OS display
 * scale (both are in `devicePixelRatio`), so the factor comes from the
 * service worker via `chrome.tabs.getZoom` and `chrome.tabs.onZoomChange`.
 * Extension pages (e.g. the options page) use the tabs API directly, since
 * messages from the service worker to a tab only reach content scripts.
 */
export function usePageZoom(enabled: boolean): number {
  const [zoomFactor, setZoomFactor] = useState(1)

  useEffect(() => {
    if (!enabled) {
      setZoomFactor(1)
      return
    }

    let disposed = false
    const update = (factor: unknown) => {
      if (!disposed && typeof factor === "number" && factor > 0) {
        setZoomFactor(factor)
      }
    }
    const warn = (error: unknown) => console.warn("Failed to get zoom:", error)

    // The tabs API is only available on extension pages.
    if (chrome.tabs?.getCurrent != null) {
      let tabId: number | undefined
      const onZoomChange = (info: chrome.tabs.OnZoomChangeInfo) => {
        if (info.tabId === tabId) update(info.newZoomFactor)
      }
      chrome.tabs.onZoomChange.addListener(onZoomChange)
      chrome.tabs
        .getCurrent()
        .then((tab) => {
          tabId = tab?.id
          return tabId != null ? chrome.tabs.getZoom(tabId) : undefined
        })
        .then(update)
        .catch(warn)
      return () => {
        disposed = true
        chrome.tabs.onZoomChange.removeListener(onZoomChange)
      }
    }

    Ipc.getZoom().then(update).catch(warn)
    const removeListener = Ipc.addListener<ZoomChangedProps>(
      TabCommand.zoomChanged,
      (param, _sender, response) => {
        update(param.zoomFactor)
        response(true)
        return false
      },
    )
    return () => {
      disposed = true
      removeListener()
    }
  }, [enabled])

  return enabled ? zoomFactor : 1
}

/**
 * Inverse of the browser zoom that the selection menu cancels, or 1 when it
 * follows the zoom. Provided around the menu UI only: by the content script
 * and by the preview on the options page. Every other UI gets 1.
 *
 * Fixed sizes are multiplied by it, either in JS or via the
 * `--sc-zoom-compensation` CSS variable. CSS `zoom` is not used: floating-ui
 * does not account for it, which misplaces the nested popovers.
 */
export const zoomCompensationContext = createContext(1)

export const useZoomCompensation = (): number =>
  useContext(zoomCompensationContext)
