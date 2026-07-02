import { describe, it, expect } from "vitest"
import { AiPromptOptionSchema } from "./schema"
import { INSERT, toInsertTemplate } from "@/services/pageAction"
import { OPEN_MODE } from "@shared/constants/open-mode"

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
