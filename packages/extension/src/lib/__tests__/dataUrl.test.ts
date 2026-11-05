import { describe, it, expect } from "vitest"
import { bytesToDataUrl } from "../dataUrl"

describe("bytesToDataUrl", () => {
  it("DU-01: encodes bytes with the given MIME type", () => {
    expect(bytesToDataUrl(new Uint8Array([97, 98, 99]), "image/png")).toBe(
      "data:image/png;base64,YWJj",
    )
  })

  it("DU-02: encodes bytes outside the ASCII range", () => {
    expect(bytesToDataUrl(new Uint8Array([0xff, 0x00]), "image/png")).toBe(
      "data:image/png;base64,/wA=",
    )
  })
})
