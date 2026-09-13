import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { OnboardingWelcome } from "./OnboardingWelcome"

// Keep in sync with OnboardingWelcome's own timings.
const WELCOME_MS = 2000
const EXIT_MS = 320

describe("OnboardingWelcome", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const advance = async (ms: number) => {
    await act(async () => {
      vi.advanceTimersByTime(ms)
    })
  }

  it("advances on its own after the welcome duration plus its exit animation", async () => {
    const onDone = vi.fn()
    render(<OnboardingWelcome onDone={onDone} />)

    await advance(WELCOME_MS - 1)
    expect(onDone).not.toHaveBeenCalled()

    await advance(1 + EXIT_MS)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("advances immediately when clicked, without waiting out the timer", async () => {
    const onDone = vi.fn()
    render(<OnboardingWelcome onDone={onDone} />)

    await act(async () => {
      screen.getByTestId("onboarding-welcome").click()
    })
    await advance(EXIT_MS)

    expect(onDone).toHaveBeenCalledTimes(1)

    // The pending auto-advance timer must not fire a second time.
    await advance(WELCOME_MS + EXIT_MS)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("keeps the pending auto-advance running across parent re-renders", async () => {
    // Callers pass an inline callback, so the overlay must not restart its
    // timer every time the parent re-renders - it would never advance.
    const onDone = vi.fn()
    const { rerender } = render(<OnboardingWelcome onDone={() => onDone()} />)

    await advance(WELCOME_MS - 100)
    rerender(<OnboardingWelcome onDone={() => onDone()} />)
    await advance(100 + EXIT_MS)

    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("does not call back after unmounting", async () => {
    const onDone = vi.fn()
    const { unmount } = render(<OnboardingWelcome onDone={onDone} />)

    unmount()
    await advance(WELCOME_MS + EXIT_MS)

    expect(onDone).not.toHaveBeenCalled()
  })
})
