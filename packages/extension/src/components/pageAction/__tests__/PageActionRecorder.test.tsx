import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { PageActionRecorder } from "../PageActionRecorder"
import { usePageZoom } from "@/hooks/usePageZoom"
import { usePageActionContext } from "@/hooks/pageAction/usePageActionContext"
import { TEST_IDS } from "@/testIds"

vi.mock("@/hooks/usePageZoom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/usePageZoom")>()),
  usePageZoom: vi.fn(),
}))

vi.mock("@/hooks/pageAction/usePageActionContext", () => ({
  usePageActionContext: vi.fn(),
}))

vi.mock("@/services/pageAction", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/pageAction")>()),
  PageActionListener: { start: vi.fn(), stop: vi.fn() },
}))

vi.mock("@/services/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/storage")>()),
  Storage: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(true),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
}))

const setRecording = (isRecording: boolean) => {
  vi.mocked(usePageActionContext).mockReturnValue({
    isRecording,
    isRunning: false,
    status: undefined,
  } as unknown as ReturnType<typeof usePageActionContext>)
}

// dnd-kit puts its attributes on the drag handle, a child of the root.
const getDragHandle = () =>
  document.querySelector("[aria-roledescription='draggable']") as HTMLElement

// The draggable root that holds the controller.
const getControllerRoot = () => getDragHandle().parentElement as HTMLElement

describe("PageActionRecorder zoom compensation", () => {
  beforeEach(() => {
    vi.mocked(usePageZoom).mockReset()
  })

  it("PAR-01: cancels the browser zoom on the controller while recording", async () => {
    setRecording(true)
    vi.mocked(usePageZoom).mockReturnValue(0.8)

    render(<PageActionRecorder />)

    await waitFor(() => expect(getDragHandle()).toBeInTheDocument())
    expect(usePageZoom).toHaveBeenCalledWith(true)
    expect(
      getControllerRoot().style.getPropertyValue("--sc-zoom-compensation"),
    ).toBe("1.25")
    // Fixed sizes in JS are scaled too, e.g. the drag handle icon (18px).
    const gripIcon = getDragHandle().querySelector("svg")
    expect(gripIcon).toHaveAttribute("width", "22.5")
  })

  it("PAR-02: keeps the original size when the zoom is 100%", async () => {
    setRecording(true)
    vi.mocked(usePageZoom).mockReturnValue(1)

    render(<PageActionRecorder />)

    await waitFor(() => expect(getDragHandle()).toBeInTheDocument())
    expect(
      getControllerRoot().style.getPropertyValue("--sc-zoom-compensation"),
    ).toBe("1")
    const gripIcon = getDragHandle().querySelector("svg")
    expect(gripIcon).toHaveAttribute("width", "18")
  })

  it("PAR-03: does not track the zoom while not recording", () => {
    setRecording(false)
    vi.mocked(usePageZoom).mockReturnValue(1)

    render(<PageActionRecorder />)

    expect(usePageZoom).toHaveBeenCalledWith(false)
    expect(
      screen.queryByTestId(TEST_IDS.pageActionCompleteButton),
    ).not.toBeInTheDocument()
  })
})
