import { useEffect, useState } from "react"
import { Ipc, BgCommand } from "@/services/ipc"
import { useTabContext } from "@/hooks/useTabContext"
import { isSidePanel } from "@/services/sidePanelDetector"

/**
 * Find the closest anchor element from the click event target
 * @param {MouseEvent} e - Click event
 * @returns {HTMLAnchorElement | null} The anchor element or null
 */
const findAnchorElement = (e: MouseEvent): HTMLAnchorElement | null => {
  let target = e.target as HTMLElement | null
  while (target && target !== document.body) {
    if (target.tagName === "A") {
      return target as HTMLAnchorElement
    }
    target = target.parentElement
  }
  return null
}

/**
 * Validate if the URL is valid for navigation
 * @param {string} url - URL to validate
 * @returns {boolean} True if the URL is valid
 */
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    // Allow only http: and https: protocols for security
    const ALLOWED_PROTOCOLS = ["http:", "https:"]
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      console.warn("[navigateSidePanel] Blocked protocol:", urlObj.protocol)
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Hook to handle navigation within SidePanel
 * Intercepts link clicks and uses chrome.sidePanel.setOptions() to navigate
 */
export function useSidePanelNavigation() {
  const { tabId } = useTabContext()
  const [activeTabId, setActiveTabId] = useState<number | null>(null)

  // Detect if current context is a SidePanel
  useEffect(() => {
    Ipc.getActiveTabId()
      .then((id) => {
        setActiveTabId(id)
      })
      .catch((e) => {
        console.error("Failed to get active tab ID:", e)
      })
  }, [tabId])

  // Hook link clicks
  useEffect(() => {
    // Derive isSidePanelPage from activeTabId as single source of truth
    const isSidePanelPage = isSidePanel(tabId, activeTabId)
    if (!isSidePanelPage) return

    const handleClick = (e: MouseEvent) => {
      const anchor = findAnchorElement(e)
      if (!anchor) return

      // Check target attribute
      const target = anchor.target
      if (target === "_blank" || target === "_parent" || target === "_top") {
        return // Let it open in a new window/tab
      }

      const href = anchor.href
      if (!href || !isValidUrl(href)) return

      // Cancel default navigation
      e.preventDefault()
      e.stopPropagation()

      // Notify background script
      Ipc.send(BgCommand.navigateSidePanel, { url: href, tabId: activeTabId })
    }

    // Register in capture phase (executes before other handlers)
    document.addEventListener("click", handleClick, { capture: true })

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [tabId, activeTabId])
}
