import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, act } from "@testing-library/react"
import { SelectContextProvider } from "../SelectContextProvider"
import { Ipc, TabCommand, type IpcCallback } from "@/services/ipc"
import { getSelectionText } from "@/services/dom"

vi.mock("@/services/ipc", () => ({
  Ipc: {
    addListener: vi.fn(),
  },
  TabCommand: {
    getSelection: "getSelection",
  },
}))

vi.mock("@/services/dom", () => ({
  getSelectionText: vi.fn(),
}))

const mockAddListener = vi.mocked(Ipc.addListener)
const mockGetSelectionText = vi.mocked(getSelectionText)
const mockRemoveListener = vi.fn()

// Calls the getSelection listener as the service worker does.
const requestSelection = () => {
  const call = mockAddListener.mock.calls.find(
    ([command]) => command === TabCommand.getSelection,
  )
  const listener = call?.[1] as IpcCallback
  const response = vi.fn()
  listener(undefined, {} as chrome.runtime.MessageSender, response)
  return response.mock.calls[0][0]
}

const selectText = (text: string) => {
  mockGetSelectionText.mockReturnValue(text)
  act(() => {
    document.dispatchEvent(new Event("selectionchange"))
  })
}

describe("SelectContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddListener.mockReturnValue(mockRemoveListener)
  })

  it("SC-01: 正常系: 現在の選択テキストを返す", () => {
    render(<SelectContextProvider>{null}</SelectContextProvider>)

    selectText("selected")

    expect(requestSelection()).toBe("selected")
  })

  it("SC-02: 正常系: アンマウント時にリスナーを解除する", () => {
    const { unmount } = render(
      <SelectContextProvider>{null}</SelectContextProvider>,
    )

    unmount()

    expect(mockRemoveListener).toHaveBeenCalledTimes(1)
  })
})
