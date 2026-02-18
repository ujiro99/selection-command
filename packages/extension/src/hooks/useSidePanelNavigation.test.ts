import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useSidePanelNavigation } from "./useSidePanelNavigation"
import { Ipc, BgCommand } from "@/services/ipc"
import { isSidePanel } from "@/services/sidePanelDetector"

// Mock dependencies
vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  BgCommand: {
    navigateSidePanel: "navigateSidePanel",
  },
}))

vi.mock("@/services/sidePanelDetector", () => ({
  isSidePanel: vi.fn(),
}))

vi.mock("@/hooks/useTabContext", () => ({
  useTabContext: () => ({ tabId: 123 }),
}))

describe("useSidePanelNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener("click", () => {}, { capture: true })
  })

  it("SPN-01: Should not attach click listener when not in SidePanel", async () => {
    vi.mocked(isSidePanel).mockReturnValue(false)
    const sendSpy = vi.spyOn(Ipc, "send")

    renderHook(() => useSidePanelNavigation())

    await waitFor(() => {
      expect(isSidePanel).toHaveBeenCalled()
    })

    // Click a link
    const link = document.createElement("a")
    link.href = "https://example.com"
    document.body.appendChild(link)
    link.click()

    expect(sendSpy).not.toHaveBeenCalled()

    document.body.removeChild(link)
  })

  it("SPN-02: Should intercept link clicks in SidePanel", async () => {
    vi.mocked(isSidePanel).mockReturnValue(true)
    const sendSpy = vi.spyOn(Ipc, "send")

    renderHook(() => useSidePanelNavigation())

    await waitFor(() => {
      expect(isSidePanel).toHaveBeenCalled()
    })

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Click a link
    const link = document.createElement("a")
    link.href = "https://example.com"
    document.body.appendChild(link)

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    })
    link.dispatchEvent(clickEvent)

    expect(sendSpy).toHaveBeenCalledWith(BgCommand.navigateSidePanel, {
      url: "https://example.com/",
      tabId: 123,
    })

    document.body.removeChild(link)
  })

  it("SPN-03: Should not intercept links with target=_blank", async () => {
    vi.mocked(isSidePanel).mockReturnValue(true)
    const sendSpy = vi.spyOn(Ipc, "send")

    renderHook(() => useSidePanelNavigation())

    await waitFor(() => {
      expect(isSidePanel).toHaveBeenCalled()
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const link = document.createElement("a")
    link.href = "https://example.com"
    link.target = "_blank"
    document.body.appendChild(link)

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    })
    link.dispatchEvent(clickEvent)

    expect(sendSpy).not.toHaveBeenCalled()

    document.body.removeChild(link)
  })

  it("SPN-04: Should not intercept links with target=_parent", async () => {
    vi.mocked(isSidePanel).mockReturnValue(true)
    const sendSpy = vi.spyOn(Ipc, "send")

    renderHook(() => useSidePanelNavigation())

    await waitFor(() => {
      expect(isSidePanel).toHaveBeenCalled()
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const link = document.createElement("a")
    link.href = "https://example.com"
    link.target = "_parent"
    document.body.appendChild(link)

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    })
    link.dispatchEvent(clickEvent)

    expect(sendSpy).not.toHaveBeenCalled()

    document.body.removeChild(link)
  })

  it("SPN-05: Should not intercept javascript: protocol links", async () => {
    vi.mocked(isSidePanel).mockReturnValue(true)
    const sendSpy = vi.spyOn(Ipc, "send")

    renderHook(() => useSidePanelNavigation())

    await waitFor(() => {
      expect(isSidePanel).toHaveBeenCalled()
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const link = document.createElement("a")
    link.href = "javascript:alert('test')"
    document.body.appendChild(link)

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    })
    link.dispatchEvent(clickEvent)

    expect(sendSpy).not.toHaveBeenCalled()

    document.body.removeChild(link)
  })

  it("SPN-06: Should not intercept data: protocol links", async () => {
    vi.mocked(isSidePanel).mockReturnValue(true)
    const sendSpy = vi.spyOn(Ipc, "send")

    renderHook(() => useSidePanelNavigation())

    await waitFor(() => {
      expect(isSidePanel).toHaveBeenCalled()
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const link = document.createElement("a")
    link.href = "data:text/html,<h1>Test</h1>"
    document.body.appendChild(link)

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    })
    link.dispatchEvent(clickEvent)

    expect(sendSpy).not.toHaveBeenCalled()

    document.body.removeChild(link)
  })

  it("SPN-07: Should handle clicks on elements inside anchor", async () => {
    vi.mocked(isSidePanel).mockReturnValue(true)
    const sendSpy = vi.spyOn(Ipc, "send")

    renderHook(() => useSidePanelNavigation())

    await waitFor(() => {
      expect(isSidePanel).toHaveBeenCalled()
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    const link = document.createElement("a")
    link.href = "https://example.com"
    const span = document.createElement("span")
    span.textContent = "Click me"
    link.appendChild(span)
    document.body.appendChild(link)

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    })
    span.dispatchEvent(clickEvent)

    expect(sendSpy).toHaveBeenCalledWith(BgCommand.navigateSidePanel, {
      url: "https://example.com/",
      tabId: 123,
    })

    document.body.removeChild(link)
  })
})
