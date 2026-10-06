import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "@/lib/sentry"

vi.mock("@/lib/sentry/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sentry/index")>()
  return { ...actual, Sentry: { captureException: vi.fn() } }
})

const Thrower = (): never => {
  throw new Error("render failed")
}

describe("ErrorBoundary", () => {
  it("calls onError with the caught error and renders the fallback", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <Thrower />
      </ErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "render failed" }),
    )
    expect(screen.getByText("render failed")).toBeTruthy()

    consoleErrorSpy.mockRestore()
  })
})
