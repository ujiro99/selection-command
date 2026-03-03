import { describe, it, expect, vi, beforeEach } from "vitest"
import { LinkPreview } from "./linkPreview"
import { Ipc, BgCommand } from "@/services/ipc"
import { findAnchorElementFromParent } from "@/services/dom"
import { getScreenSize } from "@/services/screen"
import { DRAG_OPEN_MODE } from "@/const"

// Mock dependencies
vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  BgCommand: {
    openSidePanel: "openSidePanel",
    openPopups: "openPopups",
    openPopupAndClick: "openPopupAndClick",
  },
}))

vi.mock("@/services/dom", () => ({
  findAnchorElementFromParent: vi.fn(),
}))

vi.mock("@/services/screen", () => ({
  getScreenSize: vi.fn(),
}))

describe("LinkPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("execute", () => {
    const createCommand = (openMode: string) =>
      ({
        id: "test-command",
        openMode,
        popupOption: { height: 600, width: 800 },
      }) as any

    it("LP-01: Should send openSidePanel when openMode is PREVIEW_SIDE_PANEL and href is available", async () => {
      const href = "https://example.com"
      vi.mocked(findAnchorElementFromParent).mockReturnValue({
        href,
      } as HTMLAnchorElement)

      const command = createCommand(DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL)
      const position = { x: 100, y: 200 }
      const target = document.createElement("div")

      await LinkPreview.execute({
        command,
        position,
        target,
        selectionText: "",
      })

      expect(Ipc.send).toHaveBeenCalledWith(BgCommand.openSidePanel, {
        url: href,
        isLinkCommand: true,
      })
    })

    it("LP-02: Should NOT send openSidePanel when openMode is PREVIEW_SIDE_PANEL and href is empty", async () => {
      vi.mocked(findAnchorElementFromParent).mockReturnValue({
        href: "",
      } as HTMLAnchorElement)

      const command = createCommand(DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL)
      const position = { x: 100, y: 200 }
      const target = document.createElement("div")

      await LinkPreview.execute({
        command,
        position,
        target,
        selectionText: "",
      })

      expect(Ipc.send).not.toHaveBeenCalled()
    })

    it("LP-03: Should return early after PREVIEW_SIDE_PANEL handling without calling openPopups", async () => {
      const href = "https://example.com"
      vi.mocked(findAnchorElementFromParent).mockReturnValue({
        href,
      } as HTMLAnchorElement)
      vi.mocked(getScreenSize).mockResolvedValue({} as any)

      const command = createCommand(DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL)
      const position = { x: 100, y: 200 }
      const target = document.createElement("div")

      await LinkPreview.execute({
        command,
        position,
        target,
        selectionText: "",
      })

      expect(Ipc.send).toHaveBeenCalledTimes(1)
      expect(Ipc.send).not.toHaveBeenCalledWith(
        BgCommand.openPopups,
        expect.any(Object),
      )
    })

    it("LP-04: Should not execute when position or target is null", async () => {
      const command = createCommand(DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL)

      await LinkPreview.execute({
        command,
        position: null,
        target: null,
        selectionText: "",
      })

      expect(Ipc.send).not.toHaveBeenCalled()
      expect(findAnchorElementFromParent).not.toHaveBeenCalled()
    })
  })
})
