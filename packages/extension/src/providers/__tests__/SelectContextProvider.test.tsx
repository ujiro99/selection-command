import { describe, it, expect, vi, beforeEach } from "vitest"
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

describe("SelectContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSet.mockResolvedValue(true)
    mockGetTabId.mockResolvedValue(10)
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
    mockGetTabId.mockResolvedValue(null)
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
})
