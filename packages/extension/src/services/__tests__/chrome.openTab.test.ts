import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { openTab } from "../chrome"
import { Ipc, ServiceWorkerCommand } from "../ipc"

const sourceTab = { id: 10, windowId: 1, index: 2 } as chrome.tabs.Tab
const resultTab = { id: 20, windowId: 1 } as chrome.tabs.Tab
const url = {
  searchUrl: "https://example.com/?q=%s",
  selectionText: "",
  selectionFromClipboard: true,
}

function provideClipboard(data: string, err?: string) {
  vi.mocked(chrome.runtime.onConnect.addListener).mockImplementation(
    (listener) => {
      const port = {
        sender: { tab: { id: 30 } },
        onMessage: {
          addListener: (onMessage: (message: unknown) => void) => {
            onMessage({
              command: ServiceWorkerCommand.setClipboard,
              data: { data, err },
            })
          },
          removeListener: vi.fn(),
        },
      } as unknown as chrome.runtime.Port
      listener(port)
    },
  )
}

describe("openTab", () => {
  afterEach(() => vi.unstubAllGlobals())
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.tabs.query).mockImplementation(() =>
      Promise.resolve([sourceTab]),
    )
    vi.mocked(chrome.tabs.create).mockImplementation(() =>
      Promise.resolve(resultTab),
    )
    vi.stubGlobal("chrome", {
      ...chrome,
      windows: {
        ...chrome.windows,
        create: vi.fn().mockResolvedValue({ id: 3, tabs: [{ id: 30 }] }),
        remove: vi.fn().mockResolvedValue(undefined),
      },
    })
    provideClipboard("clipboard text")
  })

  it("COT-01: 正常系: クリップボードを一時ウィンドウで読み非アクティブタブに渡す", async () => {
    const result = await openTab({ url, active: false })

    expect(chrome.windows.create).toHaveBeenCalledOnce()
    expect(chrome.windows.remove).toHaveBeenCalledWith(3)
    expect(chrome.tabs.create).toHaveBeenCalledExactlyOnceWith({
      url: "https://example.com/?q=clipboard+text",
      active: false,
      windowId: 1,
      index: 3,
    })
    expect(chrome.tabs.update).not.toHaveBeenCalled()
    expect(result).toEqual({ tabId: 20, clipboardText: "clipboard text" })
  })

  it("COT-02: 正常系: クリップボード不要なら一時ウィンドウを開かない", async () => {
    await openTab({
      url: { ...url, selectionText: "selected", selectionFromClipboard: false },
      active: false,
    })

    expect(chrome.windows.create).not.toHaveBeenCalled()
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/?q=selected",
        active: false,
      }),
    )
  })

  it("COT-03: 異常系: 読み取り失敗時も非アクティブで開きエラーを通知する", async () => {
    provideClipboard("", "Permission denied")
    const connection = vi.spyOn(Ipc, "ensureConnection").mockResolvedValue()
    const sendTab = vi.spyOn(Ipc, "sendTab").mockResolvedValue(undefined)
    try {
      const result = await openTab({ url, active: false })
      expect(chrome.tabs.create).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      )
      expect(connection).toHaveBeenCalledWith(20)
      expect(sendTab).toHaveBeenCalledWith(20, "showToast", expect.any(Object))
      expect(chrome.windows.remove).toHaveBeenCalledWith(3)
      expect(result).toEqual({ tabId: 20, clipboardText: "" })
    } finally {
      connection.mockRestore()
      sendTab.mockRestore()
    }
  })
})
