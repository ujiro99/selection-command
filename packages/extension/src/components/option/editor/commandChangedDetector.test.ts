import { describe, it, expect } from "vitest"
import { hasCommandChanged } from "./commandChangedDetector"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import type {
  SearchCommand,
  PageActionCommand,
  AiPromptCommand,
  PageActionOption,
} from "@/types"

const makeSearchCommand = (
  overrides: Partial<SearchCommand> = {},
): SearchCommand => ({
  id: "cmd-1",
  title: "Google",
  iconUrl: "https://example.com/icon.png",
  openMode: OPEN_MODE.POPUP,
  searchUrl: "https://example.com/search?q=%s",
  ...overrides,
})

const makePageActionOption = (
  overrides: Partial<PageActionOption> = {},
): PageActionOption => ({
  startUrl: "https://example.com",
  openMode: PAGE_ACTION_OPEN_MODE.POPUP,
  steps: [],
  ...overrides,
})

const makePageActionCommand = (
  overrides: Partial<Omit<PageActionCommand, "pageActionOption">> & {
    pageActionOption?: Partial<PageActionOption>
  } = {},
): PageActionCommand => {
  const { pageActionOption, ...rest } = overrides
  return {
    id: "cmd-2",
    title: "Example Action",
    iconUrl: "https://example.com/icon.png",
    openMode: OPEN_MODE.PAGE_ACTION,
    pageActionOption: makePageActionOption(pageActionOption),
    ...rest,
  }
}

const makeAiPromptCommand = (
  overrides: Partial<AiPromptCommand> = {},
): AiPromptCommand => ({
  id: "cmd-3",
  title: "AI Summarize",
  iconUrl: "https://example.com/icon.png",
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "chatgpt",
    prompt: "Summarize: {text}",
    openMode: OPEN_MODE.POPUP,
  },
  ...overrides,
})

describe("hasCommandChanged", () => {
  describe("SearchCommand", () => {
    it("returns false when searchUrl is unchanged", () => {
      const cmd = makeSearchCommand()
      expect(hasCommandChanged(cmd, cmd.searchUrl!, undefined, "")).toBe(false)
    })

    it("returns true when searchUrl is changed", () => {
      const cmd = makeSearchCommand()
      expect(
        hasCommandChanged(cmd, "https://bing.com/search?q=%s", undefined, ""),
      ).toBe(true)
    })
  })

  describe("PageActionCommand", () => {
    it("returns false when pageActionOption is unchanged", () => {
      const cmd = makePageActionCommand()
      expect(hasCommandChanged(cmd, "", { ...cmd.pageActionOption }, "")).toBe(
        false,
      )
    })

    it("returns true when startUrl is changed", () => {
      const cmd = makePageActionCommand()
      expect(
        hasCommandChanged(
          cmd,
          "",
          { ...cmd.pageActionOption, startUrl: "https://other.com" },
          "",
        ),
      ).toBe(true)
    })

    it("returns true when pageUrl is changed", () => {
      const cmd = makePageActionCommand()
      expect(
        hasCommandChanged(
          cmd,
          "",
          { ...cmd.pageActionOption, pageUrl: "https://example.com/*" },
          "",
        ),
      ).toBe(true)
    })

    it("returns false when only openMode is changed", () => {
      const cmd = makePageActionCommand()
      expect(
        hasCommandChanged(
          cmd,
          "",
          { ...cmd.pageActionOption, openMode: PAGE_ACTION_OPEN_MODE.TAB },
          "",
        ),
      ).toBe(false)
    })

    it("does not throw when currentPageActionOption is null, returns true (differs from saved)", () => {
      const cmd = makePageActionCommand()
      expect(hasCommandChanged(cmd, "", null, "")).toBe(true)
    })

    it("does not throw when currentPageActionOption is undefined, returns true (differs from saved)", () => {
      const cmd = makePageActionCommand()
      expect(hasCommandChanged(cmd, "", undefined, "")).toBe(true)
    })
  })

  describe("AiPromptCommand", () => {
    it("returns false when prompt is unchanged", () => {
      const cmd = makeAiPromptCommand()
      expect(
        hasCommandChanged(cmd, "", undefined, cmd.aiPromptOption.prompt),
      ).toBe(false)
    })

    it("returns true when prompt is changed", () => {
      const cmd = makeAiPromptCommand()
      expect(hasCommandChanged(cmd, "", undefined, "Translate: {text}")).toBe(
        true,
      )
    })
  })

  describe("other command types", () => {
    it("returns false for CopyCommand", () => {
      const cmd = makeSearchCommand({ openMode: OPEN_MODE.COPY })
      expect(hasCommandChanged(cmd, "", undefined, "")).toBe(false)
    })
  })
})
