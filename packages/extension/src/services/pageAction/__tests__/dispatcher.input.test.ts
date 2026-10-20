import { afterEach, describe, expect, it } from "vitest"
import { PageActionDispatcher } from "../dispatcher"
import { SelectorType, PAGE_ACTION_EVENT } from "@/const"

const codeText = `    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [documentUrl],
    })`

const inputCases = [
  { tag: "textarea", text: codeText },
  {
    tag: "input",
    text: "[KeyA] [Enter] {Enter} {Control>} [] [[ {{ [ 日本語 \\",
  },
] as const

describe("PageActionDispatcher literal text input", () => {
  afterEach(() => document.body.replaceChildren())

  for (const source of ["Clipboard", "SelectedText", "literal"] as const) {
    for (const { tag, text } of inputCases) {
      it(`PDI-LITERAL-${source}-${tag}: 正常系: 括弧を含む${source}を${tag}へそのまま入力する`, async () => {
        const element = document.createElement(tag)
        element.id = "target"
        document.body.append(element)

        const result = await PageActionDispatcher.input({
          type: PAGE_ACTION_EVENT.input,
          label: "Target",
          selector: "#target",
          selectorType: SelectorType.css,
          value: source === "literal" ? text : `{{${source}}}`,
          clipboardText: source === "Clipboard" ? text : "",
          selectedText: source === "SelectedText" ? text : "",
          srcUrl: "https://example.com/",
        })

        expect(result).toEqual([true])
        expect(element.value).toBe(text)
      })
    }
  }
})
