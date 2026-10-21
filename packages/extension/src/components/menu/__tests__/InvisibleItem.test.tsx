import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import { InvisibleItem } from "../InvisibleItem"
import { ExecState } from "@/const"
import type { executeActionProps } from "@/services/contextMenus"

const mockExecuteCommand = vi.fn()
const mockClearAction = vi.fn()
let mockAction: executeActionProps | null = null

vi.mock("@/hooks/useCommandExecutor", () => ({
  useCommandExecutor: () => ({
    itemState: { state: ExecState.NONE, message: "" },
    result: null,
    executeCommand: mockExecuteCommand,
    clearResult: vi.fn(),
  }),
}))

vi.mock("@/hooks/useSelectContext", () => ({
  useSelectContext: () => ({
    selectionText: "selection in tab",
    target: null,
  }),
}))

vi.mock("@/hooks/useContextMenu", () => ({
  useContextMenu: () => ({
    action: mockAction,
    clearAction: mockClearAction,
  }),
}))

const command = {
  id: "cmd-1",
  title: "Search",
  searchUrl: "https://example.com/?q=%s",
  openMode: "tab",
} as any

describe("InvisibleItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAction = null
  })

  it("II-01: 正常系: 送信元が決めた選択テキストとクリップボード利用指定で実行する", () => {
    mockAction = { command, selectionText: "", selectionFromClipboard: true }

    render(<InvisibleItem />)

    expect(mockExecuteCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        command,
        selectionText: "",
        selectionFromClipboard: true,
      }),
    )
    expect(mockClearAction).toHaveBeenCalled()
  })

  it("II-02: 正常系: 送信元が選択テキストを指定しない場合はタブの選択テキストで実行する", () => {
    // e.g. the context menu
    mockAction = { command }

    render(<InvisibleItem />)

    expect(mockExecuteCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        command,
        selectionText: "selection in tab",
      }),
    )
  })

  it("II-03: 正常系: 実行要求がなければ何もしない", () => {
    render(<InvisibleItem />)

    expect(mockExecuteCommand).not.toHaveBeenCalled()
  })
})
