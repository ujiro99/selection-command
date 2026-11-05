import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { openPopupWindow, openPopupWindowMultiple } from "../chrome"
import { readOffscreenClipboard } from "../offscreenClipboard"
import { Ipc } from "../ipc"
import { POPUP_TYPE, WINDOW_STATE } from "@/const"

vi.mock("../offscreenClipboard", () => ({ readOffscreenClipboard: vi.fn() }))
vi.mock("../screen", () => ({
  getScreenSize: vi
    .fn()
    .mockResolvedValue({ left: 0, top: 0, width: 1280, height: 800 }),
}))
vi.mock("../windowStackManager", () => ({
  WindowStackManager: { addWindows: vi.fn().mockResolvedValue(undefined) },
}))

const params = {
  commandId: "test",
  url: {
    searchUrl: "https://example.com/?q=%s",
    selectionText: "",
    selectionFromClipboard: true,
  },
  type: POPUP_TYPE.POPUP,
  top: 10,
  left: 20,
  width: 600,
  height: 700,
}

describe("openPopupWindow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readOffscreenClipboard).mockResolvedValue({
      data: "clipboard text",
    })
    vi.stubGlobal("chrome", {
      ...chrome,
      windows: {
        ...chrome.windows,
        getCurrent: vi.fn().mockResolvedValue({ id: 1, incognito: true }),
        create: vi.fn().mockResolvedValue({ id: 2, tabs: [{ id: 20 }] }),
        update: vi.fn().mockResolvedValue(undefined),
      },
      declarativeNetRequest: {
        ...chrome.declarativeNetRequest,
        RuleActionType: { MODIFY_HEADERS: "modifyHeaders" },
        HeaderOperation: { REMOVE: "remove", SET: "set" },
        ResourceType: { MAIN_FRAME: "main_frame" },
        getSessionRules: vi.fn().mockResolvedValue([]),
        updateSessionRules: vi.fn().mockResolvedValue(undefined),
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("COP-01: 正常系: 完成したURLで一度だけ作成し位置・サイズ・シークレット設定を保持する", async () => {
    expect(await openPopupWindow(params)).toEqual({
      tabId: 20,
      clipboardText: "clipboard text",
    })
    expect(chrome.windows.create).toHaveBeenCalledExactlyOnceWith({
      url: "https://example.com/?q=clipboard+text",
      type: "popup",
      top: 10,
      left: 20,
      width: 600,
      height: 700,
      state: undefined,
      incognito: true,
    })
    expect(chrome.tabs.update).not.toHaveBeenCalled()
  })

  it("COP-02: 正常系: fullscreenでは座標とサイズを渡さず作成後にも状態を適用する", async () => {
    await openPopupWindow({ ...params, windowState: WINDOW_STATE.FULLSCREEN })
    expect(chrome.windows.create).toHaveBeenCalledWith(
      expect.objectContaining({
        state: "fullscreen",
        top: undefined,
        left: undefined,
        width: undefined,
        height: undefined,
      }),
    )
    expect(chrome.windows.update).toHaveBeenCalledWith(2, {
      state: "fullscreen",
    })
  })

  it("COP-03: 異常系: 読み取り失敗時にも表示先を作成してエラーを通知する", async () => {
    vi.mocked(readOffscreenClipboard).mockResolvedValue({
      data: "",
      err: "Read failed",
    })
    const connection = vi.spyOn(Ipc, "ensureConnection").mockResolvedValue()
    const sendTab = vi.spyOn(Ipc, "sendTab").mockResolvedValue(undefined)
    try {
      await openPopupWindow(params)
      expect(chrome.windows.create).toHaveBeenCalledOnce()
      expect(connection).toHaveBeenCalledWith(20)
      expect(sendTab).toHaveBeenCalledWith(20, "showToast", expect.any(Object))
    } finally {
      connection.mockRestore()
      sendTab.mockRestore()
    }
  })
})

describe("openPopupWindowMultiple", () => {
  const multipleParams = {
    commandId: "test",
    urls: ["https://example.com/a", "https://example.com/b"],
    type: POPUP_TYPE.NORMAL,
    top: 10,
    left: 20,
    width: 600,
    height: 700,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    let id = 2
    vi.stubGlobal("chrome", {
      ...chrome,
      windows: {
        ...chrome.windows,
        getCurrent: vi.fn().mockResolvedValue({ id: 1, incognito: false }),
        create: vi.fn().mockImplementation(() => {
          const windowId = id++
          return Promise.resolve({ id: windowId, tabs: [{ id: windowId * 10 }] })
        }),
        update: vi.fn().mockResolvedValue(undefined),
      },
      declarativeNetRequest: {
        ...chrome.declarativeNetRequest,
        RuleActionType: { MODIFY_HEADERS: "modifyHeaders" },
        HeaderOperation: { REMOVE: "remove", SET: "set" },
        ResourceType: { MAIN_FRAME: "main_frame" },
        getSessionRules: vi.fn().mockResolvedValue([]),
        updateSessionRules: vi.fn().mockResolvedValue(undefined),
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("COPM-01: 正常系: 状態指定なしでは位置とサイズを指定して全URLのウィンドウを作成する", async () => {
    await openPopupWindowMultiple({ ...multipleParams })
    expect(chrome.windows.create).toHaveBeenCalledTimes(2)
    expect(chrome.windows.create).toHaveBeenCalledWith(
      expect.objectContaining({ width: 600, height: 700, state: undefined }),
    )
    expect(chrome.windows.update).not.toHaveBeenCalled()
  })

  it("COPM-02: 正常系: maximizedでは座標とサイズを渡さずに作成する", async () => {
    await openPopupWindowMultiple({
      ...multipleParams,
      windowState: WINDOW_STATE.MAXIMIZED,
    })
    expect(chrome.windows.create).toHaveBeenCalledTimes(2)
    expect(chrome.windows.create).toHaveBeenCalledWith(
      expect.objectContaining({
        state: "maximized",
        top: undefined,
        left: undefined,
        width: undefined,
        height: undefined,
      }),
    )
    expect(chrome.windows.update).not.toHaveBeenCalled()
  })

  it("COPM-03: 正常系: fullscreenでは作成後に全ウィンドウへ状態を再適用する", async () => {
    await openPopupWindowMultiple({
      ...multipleParams,
      windowState: WINDOW_STATE.FULLSCREEN,
    })
    expect(chrome.windows.update).toHaveBeenCalledWith(2, {
      state: "fullscreen",
    })
    expect(chrome.windows.update).toHaveBeenCalledWith(3, {
      state: "fullscreen",
    })
  })
})
