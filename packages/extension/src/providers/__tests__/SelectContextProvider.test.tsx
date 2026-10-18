import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { SelectContextProvider } from "../SelectContextProvider"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { Ipc } from "@/services/ipc"
import { getSelectionText } from "@/services/dom"

vi.mock("@/services/storage", () => ({
  Storage: {
    set: vi.fn(),
  },
  SESSION_STORAGE_KEY: {
    SELECTION_TEXT: "selectionText",
  },
}))

vi.mock("@/services/ipc", () => ({
  Ipc: {
    getTabId: vi.fn(),
  },
}))

vi.mock("@/services/dom", () => ({
  getSelectionText: vi.fn(),
}))

const mockSet = vi.mocked(Storage.set)
const mockGetTabId = vi.mocked(Ipc.getTabId)
const mockGetSelectionText = vi.mocked(getSelectionText)

const setVisibilityState = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  })
}

describe("SelectContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSet.mockResolvedValue(true)
    mockGetTabId.mockResolvedValue(10)
    setVisibilityState("visible")
  })

  afterEach(() => {
    setVisibilityState("visible")
  })

  it("SC-01: 正常系: 選択変更時に選択テキストとタブIDを保存する", async () => {
    mockGetSelectionText.mockReturnValue("selected")
    render(<SelectContextProvider>{null}</SelectContextProvider>)

    document.dispatchEvent(new Event("selectionchange"))

    await waitFor(() => {
      expect(mockSet).toHaveBeenCalledWith(SESSION_STORAGE_KEY.SELECTION_TEXT, {
        text: "selected",
        tabId: 10,
      })
    })
  })

  it("SC-02: 異常系: タブIDを取得できない場合はtabIdをnullとして保存する", async () => {
    mockGetTabId.mockRejectedValue(new Error("no tab"))
    mockGetSelectionText.mockReturnValue("selected")
    render(<SelectContextProvider>{null}</SelectContextProvider>)

    document.dispatchEvent(new Event("selectionchange"))

    await waitFor(() => {
      expect(mockSet).toHaveBeenCalledWith(SESSION_STORAGE_KEY.SELECTION_TEXT, {
        text: "selected",
        tabId: null,
      })
    })
  })

  it("SC-03: 正常系: タブIDの取得は一度だけ行う", async () => {
    mockGetSelectionText.mockReturnValue("selected")
    render(<SelectContextProvider>{null}</SelectContextProvider>)

    document.dispatchEvent(new Event("selectionchange"))
    document.dispatchEvent(new Event("selectionchange"))

    await waitFor(() => expect(mockSet).toHaveBeenCalledTimes(2))
    expect(mockGetTabId).toHaveBeenCalledTimes(1)
  })

  it("SC-04: 正常系: タブが表示されたときに選択中のテキストを再保存する", async () => {
    mockGetSelectionText.mockReturnValue("kept selection")
    render(<SelectContextProvider>{null}</SelectContextProvider>)

    document.dispatchEvent(new Event("visibilitychange"))

    await waitFor(() => {
      expect(mockSet).toHaveBeenCalledWith(SESSION_STORAGE_KEY.SELECTION_TEXT, {
        text: "kept selection",
        tabId: 10,
      })
    })
  })

  it("SC-05: 境界値: タブが表示されたときに選択が空なら保存しない", async () => {
    mockGetSelectionText.mockReturnValue("")
    render(<SelectContextProvider>{null}</SelectContextProvider>)

    document.dispatchEvent(new Event("visibilitychange"))
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockSet).not.toHaveBeenCalled()
  })

  it("SC-06: 境界値: タブが非表示になったときは保存しない", async () => {
    mockGetSelectionText.mockReturnValue("selected")
    setVisibilityState("hidden")
    render(<SelectContextProvider>{null}</SelectContextProvider>)

    document.dispatchEvent(new Event("visibilitychange"))
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockSet).not.toHaveBeenCalled()
  })
})
