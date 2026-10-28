import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const mockSendEvent = vi.fn()
const mockShouldThrow = { value: false }

vi.mock("@/services/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/analytics")>()
  return {
    ANALYTICS_EVENTS: actual.ANALYTICS_EVENTS,
    toErrorMessageParam: actual.toErrorMessageParam,
    sendEvent: mockSendEvent,
  }
})

vi.mock("@/components/onboarding/OnboardingPage", () => ({
  OnboardingPage: () => {
    if (mockShouldThrow.value) throw new Error("render failed")
    return <div>onboarding</div>
  },
}))

// Simulates componentDidCatch firing more than once for the same failure
// (StrictMode, re-render loops), which must still be reported only once.
vi.mock("@/lib/sentry", () => {
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode; onError?: (error: Error) => void },
    { error: Error | null }
  > {
    state = { error: null as Error | null }
    static getDerivedStateFromError(error: Error) {
      return { error }
    }
    componentDidCatch(error: Error) {
      this.props.onError?.(error)
      this.props.onError?.(error)
    }
    render() {
      return this.state.error ? null : this.props.children
    }
  }
  return {
    initSentry: vi.fn().mockResolvedValue(undefined),
    Sentry: { captureException: vi.fn() },
    ErrorBoundary,
  }
})

vi.mock("@/services/i18n", () => ({ getCurrentLocale: () => "en" }))

const loadPage = async () => {
  vi.resetModules()
  await import("../onboarding_page")
}

describe("onboarding_page entry", () => {
  beforeEach(() => {
    mockSendEvent.mockClear()
    mockShouldThrow.value = false
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("OP-01: sends onboarding_page_loaded before React renders", async () => {
    await loadPage()

    // Sent synchronously while the module is evaluated, i.e. before the
    // asynchronous React render has produced any DOM.
    expect(mockSendEvent).toHaveBeenCalledWith(
      "onboarding_page_loaded",
      {},
      "Onboarding",
    )
    expect(document.getElementById("root")?.textContent).toBe("")
    await vi.waitFor(() =>
      expect(document.getElementById("root")?.textContent).toBe("onboarding"),
    )
  })

  it("OP-02: reports a render error only once", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    mockShouldThrow.value = true

    await loadPage()

    await vi.waitFor(() =>
      expect(mockSendEvent).toHaveBeenCalledWith(
        "onboarding_render_error",
        { error_message: "render failed" },
        "Onboarding",
      ),
    )
    const renderErrorCalls = mockSendEvent.mock.calls.filter(
      ([name]) => name === "onboarding_render_error",
    )
    expect(renderErrorCalls).toHaveLength(1)

    consoleErrorSpy.mockRestore()
  })
})
