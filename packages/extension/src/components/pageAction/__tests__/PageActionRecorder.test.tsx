import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import { PageActionRecorder } from "../PageActionRecorder"
import { usePageZoom } from "@/hooks/usePageZoom"
import { usePageActionContext } from "@/hooks/pageAction/usePageActionContext"
import { TEST_IDS } from "@/testIds"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"

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
    vi.clearAllMocks()
    vi.mocked(usePageZoom).mockReset()
  })

  it("PAR-01: 正常系: 記録中はコントローラのブラウザズームを打ち消す", async () => {
    setRecording(true)
    vi.mocked(usePageZoom).mockReturnValue(0.8)

    render(<PageActionRecorder />)

    await waitFor(() => expect(getDragHandle()).toBeInTheDocument())
    expect(usePageZoom).toHaveBeenCalledWith(true)
    expect(
      getControllerRoot().style.getPropertyValue("--sc-zoom-compensation"),
    ).toBe("1.25")
    // Lengths set in JS are scaled too, e.g. the initial offset (10px).
    expect(getControllerRoot().style.right).toBe("12.5px")
    expect(getControllerRoot().style.bottom).toBe("12.5px")
  })

  it("PAR-02: 正常系: ズーム100%では元のサイズを保つ", async () => {
    setRecording(true)
    vi.mocked(usePageZoom).mockReturnValue(1)

    render(<PageActionRecorder />)

    await waitFor(() => expect(getDragHandle()).toBeInTheDocument())
    expect(
      getControllerRoot().style.getPropertyValue("--sc-zoom-compensation"),
    ).toBe("1")
    expect(getControllerRoot().style.right).toBe("10px")
  })

  it("PAR-03: 正常系: 記録中でなければズームを追跡しない", () => {
    setRecording(false)
    vi.mocked(usePageZoom).mockReturnValue(1)

    render(<PageActionRecorder />)

    expect(usePageZoom).toHaveBeenCalledWith(false)
    expect(
      screen.queryByTestId(TEST_IDS.pageActionCompleteButton),
    ).not.toBeInTheDocument()
  })
})

describe("PageActionRecorder controller overflow", () => {
  const savedPosition = { x: 500, y: 300 }
  const controllerSize = { width: 450, height: 89 }
  let rectSpy: ReturnType<typeof vi.spyOn>

  const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, "innerWidth", {
      value: width,
      configurable: true,
    })
    Object.defineProperty(window, "innerHeight", {
      value: height,
      configurable: true,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setRecording(true)
    vi.mocked(usePageZoom).mockReturnValue(1)
    vi.mocked(Storage.get).mockImplementation(async (key) =>
      key === SESSION_STORAGE_KEY.PA_RECORDER_OPTION
        ? { controllerPosition: savedPosition }
        : {},
    )
    rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        ...controllerSize,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: controllerSize.width,
        bottom: controllerSize.height,
        toJSON: () => ({}),
      })
  })

  afterEach(() => {
    vi.mocked(Storage.get).mockResolvedValue({})
    rectSpy.mockRestore()
    setViewport(1024, 768)
  })

  it("PAR-04: 正常系: ビューポートに収まる保存位置にコントローラを置く", async () => {
    setViewport(1024, 768)

    render(<PageActionRecorder />)

    await waitFor(() => expect(getControllerRoot().style.left).toBe("500px"))
    expect(getControllerRoot().style.top).toBe("300px")
  })

  it("PAR-05: 正常系: ビューポートが縮んではみ出したら初期位置に戻す", async () => {
    setViewport(1024, 768)
    render(<PageActionRecorder />)
    await waitFor(() => expect(getControllerRoot().style.left).toBe("500px"))

    // Zooming in shrinks the viewport in CSS px and fires a resize event.
    act(() => {
      setViewport(800, 600)
      window.dispatchEvent(new Event("resize"))
    })

    await waitFor(() => expect(getControllerRoot().style.right).toBe("10px"))
    expect(getControllerRoot().style.left).toBe("")
  })

  it("PAR-06: 境界値: 右下の端がビューポートの端に一致するときは位置を保つ", async () => {
    setViewport(
      savedPosition.x + controllerSize.width,
      savedPosition.y + controllerSize.height,
    )

    render(<PageActionRecorder />)

    await waitFor(() => expect(getControllerRoot().style.left).toBe("500px"))
    act(() => {
      window.dispatchEvent(new Event("resize"))
    })
    expect(getControllerRoot().style.left).toBe("500px")
  })
})
