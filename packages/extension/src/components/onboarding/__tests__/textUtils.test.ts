import { describe, it, expect } from "vitest"
import { splitTargetWord } from "../textUtils"

const TEXT =
  "An extension that lets you search selected text in a single click."

describe("splitTargetWord", () => {
  it("OTU-01: splits the text around the first occurrence of the word", () => {
    expect(splitTargetWord(TEXT, "extension")).toEqual({
      before: "An ",
      word: "extension",
      after: " that lets you search selected text in a single click.",
    })
  })

  it("OTU-02: returns null when the word is missing or absent from the text", () => {
    expect(splitTargetWord(TEXT, undefined)).toBeNull()
    expect(splitTargetWord(TEXT, "")).toBeNull()
    expect(splitTargetWord(TEXT, "browser")).toBeNull()
  })
})
