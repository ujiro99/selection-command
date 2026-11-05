import { describe, it, expect } from "vitest"
import {
  isSelectionCommand,
  isLinkCommand,
  isSearchCommand,
  isPageActionCommand,
  isAiPromptCommand,
  isLinkPopupCommand,
  isCopyCommand,
} from "../commandGuards"
import { OPEN_MODE, DRAG_OPEN_MODE } from "@/const"

const command = (openMode: string) => ({
  id: "cmd",
  title: "Command",
  iconUrl: "",
  openMode,
})

const folder = { id: "folder", title: "Folder" }

// Values that are not commands at all.
const nonCommands = [undefined, null, "popup", 1, folder]

describe("isSelectionCommand", () => {
  it.each(Object.values(OPEN_MODE))(
    "CG-01: returns true for a command with openMode %s",
    (openMode) => {
      expect(isSelectionCommand(command(openMode))).toBe(true)
    },
  )

  it("CG-02: returns false for a link command", () => {
    expect(isSelectionCommand(command(DRAG_OPEN_MODE.PREVIEW_POPUP))).toBe(
      false,
    )
  })

  it.each(nonCommands)("CG-03: returns false for %s", (data) => {
    expect(isSelectionCommand(data)).toBe(false)
  })
})

describe("isLinkCommand", () => {
  it.each(Object.values(DRAG_OPEN_MODE))(
    "CG-04: returns true for a command with openMode %s",
    (openMode) => {
      expect(isLinkCommand(command(openMode))).toBe(true)
    },
  )

  it("CG-05: returns false for a selection command", () => {
    expect(isLinkCommand(command(OPEN_MODE.POPUP))).toBe(false)
  })

  it.each(nonCommands)("CG-06: returns false for %s", (data) => {
    expect(isLinkCommand(data)).toBe(false)
  })
})

describe("command type guards by openMode", () => {
  it.each([
    [
      "isSearchCommand",
      isSearchCommand,
      [
        OPEN_MODE.POPUP,
        OPEN_MODE.WINDOW,
        OPEN_MODE.TAB,
        OPEN_MODE.BACKGROUND_TAB,
        OPEN_MODE.SIDE_PANEL,
      ],
    ],
    ["isPageActionCommand", isPageActionCommand, [OPEN_MODE.PAGE_ACTION]],
    ["isAiPromptCommand", isAiPromptCommand, [OPEN_MODE.AI_PROMPT]],
    ["isLinkPopupCommand", isLinkPopupCommand, [OPEN_MODE.LINK_POPUP]],
    ["isCopyCommand", isCopyCommand, [OPEN_MODE.COPY]],
  ] as const)(
    "CG-07: %s returns true only for its open modes",
    (_, guard, modes) => {
      for (const openMode of Object.values(OPEN_MODE)) {
        expect(guard(command(openMode))).toBe(
          (modes as readonly string[]).includes(openMode),
        )
      }
    },
  )

  it.each([
    isSearchCommand,
    isPageActionCommand,
    isAiPromptCommand,
    isLinkPopupCommand,
    isCopyCommand,
  ])("CG-08: returns false for non-command values", (guard) => {
    for (const data of nonCommands) {
      expect(guard(data)).toBe(false)
    }
  })
})
