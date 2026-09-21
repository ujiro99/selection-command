import { describe, it, expect } from "vitest"
import { AiPromptOptionSchema, commandSchema, folderSchema } from "./schema"
import { INSERT, toInsertTemplate } from "@/services/pageAction"
import { OPEN_MODE } from "@shared/constants/open-mode"
import { PAGE_ACTION_OPEN_MODE, SPACE_ENCODING } from "@/const"

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

describe("excludeFromGlobalIconColor in schemas", () => {
  it("SC-06: accepts command with excludeFromGlobalIconColor true and false", () => {
    const validSearchCmd = {
      id: "test-cmd",
      openMode: OPEN_MODE.POPUP,
      title: "Test Search",
      iconUrl: "https://example.com/icon.png",
      searchUrl: "https://example.com/search?q=%s",
      openModeSecondary: OPEN_MODE.TAB,
      spaceEncoding: SPACE_ENCODING.PLUS,
      excludeFromGlobalIconColor: true,
    }
    const res = commandSchema.safeParse(validSearchCmd)
    expect(res.success).toBe(true)
    if (res.success && res.data.openMode === OPEN_MODE.POPUP) {
      expect(res.data.excludeFromGlobalIconColor).toBe(true)
    }

    const withoutOverride = {
      ...validSearchCmd,
      excludeFromGlobalIconColor: undefined,
    }
    const res2 = commandSchema.safeParse(withoutOverride)
    expect(res2.success).toBe(true)
  })

  it("SC-07: accepts folder with excludeFromGlobalIconColor", () => {
    const validFolder = {
      id: "test-folder",
      title: "Test Folder",
      iconUrl: "https://example.com/folder.png",
      excludeFromGlobalIconColor: true,
    }
    const res = folderSchema.safeParse(validFolder)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.excludeFromGlobalIconColor).toBe(true)
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

  it("SC-08: accepts PageAction command without userVariables (backward compatibility)", () => {
    const res = commandSchema.safeParse(basePageActionCmd)
    expect(res.success).toBe(true)
  })

  it("SC-09: accepts PageAction command with an empty userVariables list", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        userVariables: [],
      },
    })
    expect(res.success).toBe(true)
  })

  it("SC-10: accepts PageAction command with a configured user variable", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        userVariables: [
          { name: "Prompt", value: "Summarize: {{SelectedText}}" },
        ],
      },
    })
    expect(res.success).toBe(true)
    if (res.success && res.data.openMode === OPEN_MODE.PAGE_ACTION) {
      expect(res.data.pageActionOption.userVariables?.[0].value).toBe(
        "Summarize: {{SelectedText}}",
      )
    }
  })

  it("SC-13: rejects a user variable whose name collides with a built-in", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        userVariables: [{ name: "SelectedText", value: "x" }],
      },
    })
    expect(res.success).toBe(false)
  })

  it("SC-14: rejects more than five user variables", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        userVariables: Array.from({ length: 6 }, (_, i) => ({
          name: `Var${i}`,
          value: "x",
        })),
      },
    })
    expect(res.success).toBe(false)
  })

  it("SC-15: rejects an empty user variable name", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        userVariables: [{ name: "", value: "x" }],
      },
    })
    expect(res.success).toBe(false)
  })

  it("SC-16: rejects a user variable name longer than 20 characters", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        userVariables: [{ name: "A12345678901234567890", value: "x" }],
      },
    })
    expect(res.success).toBe(false)
  })

  it("SC-17: rejects duplicate user variable names", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        userVariables: [
          { name: "Prompt", value: "first" },
          { name: "Prompt", value: "second" },
        ],
      },
    })
    expect(res.success).toBe(false)
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
    if (res.success && res.data.openMode === OPEN_MODE.PAGE_ACTION) {
      expect(res.data.pageActionOption.openMode).toBe(
        PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
      )
    }
  })

  it("SC-12: accepts PageAction command with openMode SIDE_PANEL and a user variable", () => {
    const res = commandSchema.safeParse({
      ...basePageActionCmd,
      pageActionOption: {
        ...basePageActionCmd.pageActionOption,
        openMode: PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
        userVariables: [
          { name: "Prompt", value: "Explain {{SelectedText}} in detail" },
        ],
      },
    })
    expect(res.success).toBe(true)
    if (res.success && res.data.openMode === OPEN_MODE.PAGE_ACTION) {
      expect(res.data.pageActionOption.openMode).toBe(
        PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
      )
      expect(res.data.pageActionOption.userVariables?.[0].value).toBe(
        "Explain {{SelectedText}} in detail",
      )
    }
  })
})
