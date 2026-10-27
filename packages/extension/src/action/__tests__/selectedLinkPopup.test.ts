import { describe, it, expect, vi, beforeEach } from "vitest"
import { SelectedLinkPopup } from "../selectedLinkPopup"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { urlsInSelection } from "@/services/dom"
import { OPEN_MODE, POPUP_TYPE, WINDOW_STATE } from "@/const"
import type { LinkPopupCommand } from "@/types"

vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  ServiceWorkerCommand: {
    openTabs: "openTabs",
    openPopups: "openPopups",
    openSidePanel: "openSidePanel",
  },
}))

vi.mock("@/services/dom", () => ({
  urlsInSelection: vi.fn(),
}))

vi.mock("@/services/screen", () => ({
  getWindowPosition: vi.fn().mockResolvedValue({ top: 10, left: 20 }),
}))

const createCommand = (openMode?: OPEN_MODE): LinkPopupCommand => ({
  id: "link-popup",
  title: "Open Links",
  iconUrl: "",
  openMode: OPEN_MODE.LINK_POPUP,
  popupOption: { width: 800, height: 600 },
  windowState: WINDOW_STATE.MAXIMIZED,
  ...(openMode ? { linkPopupOption: { openMode } } : {}),
})

const execute = (
  openMode: OPEN_MODE | undefined,
  urls = ["https://example.com/a"],
  position: { x: number; y: number } | null = { x: 100, y: 200 },
) => {
  vi.mocked(urlsInSelection).mockReturnValue(urls)
  return SelectedLinkPopup.execute({
    command: createCommand(openMode),
    selectionText: "selected text",
    position,
  })
}

describe("SelectedLinkPopup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("SLP-01: opens the URLs in tabs and activates the first one", async () => {
    const urls = ["https://example.com/a", "https://example.com/b"]
    await execute(OPEN_MODE.TAB, urls)
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.openTabs, {
      urls,
      active: true,
    })
  })

  it("SLP-02: opens the URLs in background tabs", async () => {
    await execute(OPEN_MODE.BACKGROUND_TAB)
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.openTabs, {
      urls: ["https://example.com/a"],
      active: false,
    })
  })

  it("SLP-03: opens the URL in the side panel", async () => {
    await execute(OPEN_MODE.SIDE_PANEL)
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.openSidePanel, {
      url: "https://example.com/a",
    })
  })

  it("SLP-04: opens the URLs in popups at the menu position", async () => {
    const urls = ["https://example.com/a", "https://example.com/b"]
    await execute(OPEN_MODE.POPUP, urls)
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.openPopups, {
      commandId: "link-popup",
      urls,
      top: 210,
      left: 140,
      width: 800,
      height: 600,
      type: POPUP_TYPE.POPUP,
      windowState: undefined,
    })
  })

  it("SLP-05: opens the URLs in windows with the window state", async () => {
    await execute(OPEN_MODE.WINDOW)
    expect(Ipc.send).toHaveBeenCalledWith(
      ServiceWorkerCommand.openPopups,
      expect.objectContaining({
        type: POPUP_TYPE.NORMAL,
        windowState: WINDOW_STATE.MAXIMIZED,
      }),
    )
  })

  it("SLP-06: opens popups for a command without the open mode option", async () => {
    await execute(undefined)
    expect(Ipc.send).toHaveBeenCalledWith(
      ServiceWorkerCommand.openPopups,
      expect.objectContaining({ type: POPUP_TYPE.POPUP }),
    )
  })

  it("SLP-07: does nothing when no URL is found in the selection", async () => {
    await execute(OPEN_MODE.TAB, [])
    expect(urlsInSelection).toHaveBeenCalledWith("selected text")
    expect(Ipc.send).not.toHaveBeenCalled()
  })

  it("SLP-08: does not open the side panel with multiple URLs", async () => {
    await execute(OPEN_MODE.SIDE_PANEL, [
      "https://example.com/a",
      "https://example.com/b",
    ])
    expect(Ipc.send).not.toHaveBeenCalled()
  })

  it("SLP-09: does not open popups without a position", async () => {
    await execute(OPEN_MODE.POPUP, ["https://example.com/a"], null)
    expect(Ipc.send).not.toHaveBeenCalled()
  })
})
