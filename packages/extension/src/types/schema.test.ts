import { describe, it, expect } from "vitest"
import { AiPromptOptionSchema } from "./schema"
import { INSERT, toInsertTemplate } from "@/services/pageAction"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE, SPACE_ENCODING } from "@/const"

const baseOption = {
  serviceId: "chatgpt",
  openMode: OPEN_MODE.POPUP,
}

describe("AiPromptOptionSchema", () => {
  it("SC-01: should accept a prompt with no HTML attachment placeholder", () => {
    const result = AiPromptOptionSchema.safeParse({
      ...baseOption,
      prompt: "Explain: {{SelectedText}}",
    })
    expect(result.success).toBe(true)
  })

  it("SC-02: should accept a prompt with exactly one PAGE_HTML placeholder", () => {
    const result = AiPromptOptionSchema.safeParse({
      ...baseOption,
      prompt: toInsertTemplate(INSERT.PAGE_HTML),
    })
    expect(result.success).toBe(true)
  })

  it("SC-03: should accept a prompt with exactly one SELECTION_HTML placeholder", () => {
    const result = AiPromptOptionSchema.safeParse({
      ...baseOption,
      prompt: toInsertTemplate(INSERT.SELECTION_HTML),
    })
    expect(result.success).toBe(true)
  })

  it("SC-04: should reject a prompt containing both PAGE_HTML and SELECTION_HTML placeholders", () => {
    const result = AiPromptOptionSchema.safeParse({
      ...baseOption,
      prompt: `${toInsertTemplate(INSERT.PAGE_HTML)} ${toInsertTemplate(INSERT.SELECTION_HTML)}`,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["prompt"])
    }
  })

  it("SC-05: should reject a prompt containing the same HTML placeholder twice", () => {
    const result = AiPromptOptionSchema.safeParse({
      ...baseOption,
      prompt: `${toInsertTemplate(INSERT.PAGE_HTML)} and again ${toInsertTemplate(INSERT.PAGE_HTML)}`,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["prompt"])
    }
  })
})

describe("overrideGlobalIconColor in schemas", () => {
  it("SC-06: accepts command with overrideGlobalIconColor true and false", () => {
    const validSearchCmd = {
      id: "test-cmd",
      openMode: OPEN_MODE.POPUP,
      title: "Test Search",
      iconUrl: "https://example.com/icon.png",
      searchUrl: "https://example.com/search?q=%s",
      openModeSecondary: OPEN_MODE.TAB,
      spaceEncoding: SPACE_ENCODING.PLUS,
      overrideGlobalIconColor: true,
    }
    const res = commandSchema.safeParse(validSearchCmd)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.overrideGlobalIconColor).toBe(true)
    }

    const withoutOverride = {
      ...validSearchCmd,
      overrideGlobalIconColor: undefined,
    }
    const res2 = commandSchema.safeParse(withoutOverride)
    expect(res2.success).toBe(true)
  })

  it("SC-07: accepts folder with overrideGlobalIconColor", () => {
    const validFolder = {
      id: "test-folder",
      title: "Test Folder",
      iconUrl: "https://example.com/folder.png",
      overrideGlobalIconColor: true,
    }
    const res = folderSchema.safeParse(validFolder)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.overrideGlobalIconColor).toBe(true)
    }
  })
})

describe("PageActionOption in schemas", () => {
  const basePageActionCmd = {
    id: "test-pa-cmd",
    openMode: OPEN_MODE.PAGE_ACTION,
    title: "Test Page Action",
    iconUrl: "https://example.com/icon.png",
    pageActionOption: {
      startUrl: "https://example.com",
      openMode: "popup",
      steps: [],
    },
  }

  it("SC-08: accepts PageAction command without prompt field (backward compatibility)", () => {
    const res = commandSchema.safeParse(basePageActionCmd)
    expect(res.success).toBe(true)
  })

  it("SC-09: accepts PageAction command with empty prompt", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        prompt: "",
      },
    })
    expect(res.success).toBe(true)
  })

  it("SC-10: accepts PageAction command with configured prompt", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        prompt: "Summarize: {{SelectedText}}",
      },
    })
    expect(res.success).toBe(true)
    if (res.success && "pageActionOption" in res.data) {
      expect((res.data.pageActionOption as any).prompt).toBe(
        "Summarize: {{SelectedText}}",
      )
    }
  })

  it("SC-11: accepts PageAction command with openMode SIDE_PANEL", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        openMode: PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
      },
    })
    expect(res.success).toBe(true)
    if (res.success && "pageActionOption" in res.data) {
      expect((res.data.pageActionOption as any).openMode).toBe(
        PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
      )
    }
  })

  it("SC-12: accepts PageAction command with openMode SIDE_PANEL and configured prompt", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        openMode: PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
        prompt: "Explain {{SelectedText}} in detail",
      },
    })
    expect(res.success).toBe(true)
    if (res.success && "pageActionOption" in res.data) {
      expect((res.data.pageActionOption as any).openMode).toBe(
        PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
      )
      expect((res.data.pageActionOption as any).prompt).toBe(
        "Explain {{SelectedText}} in detail",
      )
    }
  })
})
