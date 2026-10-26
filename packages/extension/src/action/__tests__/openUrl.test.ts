import { describe, it, expect, vi, beforeEach } from "vitest"
import { OpenUrl } from "../openUrl"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { urlsInSelection } from "@/services/dom"
import { OPEN_MODE, POPUP_TYPE, WINDOW_STATE } from "@/const"

vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  ServiceWorkerCommand: {
    openTab: "openTab",
    openPopup: "openPopup",
    openSidePanel: "openSidePanel",
  },
}))

vi.mock("@/services/dom", () => ({
  urlsInSelection: vi.fn(),
}))

vi.mock("@/services/screen", () => ({
  getWindowPosition: vi.fn().mockResolvedValue({ top: 10, left: 20 }),
}))

const createCommand = (openMode: OPEN_MODE) =>
  ({
    id: "open-url",
    title: "Open URL",
    iconUrl: "",
    openMode: OPEN_MODE.OPEN_URL,
    popupOption: { width: 800, height: 600 },
    windowState: WINDOW_STATE.MAXIMIZED,
    openUrlOption: { openMode },
  }) as any

const execute = (
  openMode: OPEN_MODE,
  urls = ["https://example.com/a"],
  position: { x: number; y: number } | null = { x: 100, y: 200 },
) => {
  vi.mocked(urlsInSelection).mockReturnValue(urls)
  return OpenUrl.execute({
    command: createCommand(openMode),
    selectionText: "selected text",
    position,
    selectionFromClipboard: false,
  })
}

describe("OpenUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("OU-01: opens the URL in an active tab", async () => {
    await execute(OPEN_MODE.TAB)
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.openTab, {
      url: "https://example.com/a",
      active: true,
    })
  })

  it("OU-02: opens the URL in a background tab", async () => {
    await execute(OPEN_MODE.BACKGROUND_TAB)
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.openTab, {
      url: "https://example.com/a",
      active: false,
    })
  })

  it("OU-03: opens the URL in the side panel", async () => {
    await execute(OPEN_MODE.SIDE_PANEL)
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.openSidePanel, {
      url: "https://example.com/a",
    })
  })

  it("OU-04: opens the URL in a popup at the menu position", async () => {
    await execute(OPEN_MODE.POPUP)
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.openPopup, {
      commandId: "open-url",
      url: "https://example.com/a",
      top: 210,
      left: 120,
      width: 800,
      height: 600,
      type: POPUP_TYPE.POPUP,
      windowState: undefined,
    })
  })

  it("OU-05: opens the URL in a window with the window state", async () => {
    await execute(OPEN_MODE.WINDOW)
    expect(Ipc.send).toHaveBeenCalledWith(
      ServiceWorkerCommand.openPopup,
      expect.objectContaining({
        type: POPUP_TYPE.NORMAL,
        windowState: WINDOW_STATE.MAXIMIZED,
      }),
    )
  })

  it("OU-06: does nothing when no URL is found in the selection", async () => {
    await execute(OPEN_MODE.TAB, [])
    expect(urlsInSelection).toHaveBeenCalledWith("selected text")
    expect(Ipc.send).not.toHaveBeenCalled()
  })

  it("OU-07: does nothing when multiple URLs are found in the selection", async () => {
    await execute(OPEN_MODE.TAB, [
      "https://example.com/a",
      "https://example.com/b",
    ])
    expect(Ipc.send).not.toHaveBeenCalled()
  })

  it("OU-08: does not open a popup without a position", async () => {
    await execute(OPEN_MODE.POPUP, ["https://example.com/a"], null)
    expect(Ipc.send).not.toHaveBeenCalled()
  })
})
