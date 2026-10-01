import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: { get: vi.fn(), set: vi.fn() },
}))

vi.mock("@/services/storage", () => ({
  Storage: mockStorage,
  SESSION_STORAGE_KEY: { DEV_TOOLS_ENABLED: "devToolsEnabled" },
}))

import { syncDevToolsFlag } from "../devFlag"

describe("syncDevToolsFlag", () => {
  beforeEach(() => {
    mockStorage.set.mockReset()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("mirrors an enabled flag to the session storage", async () => {
    localStorage.setItem("selectionCommand.devTools", "true")

    await syncDevToolsFlag()

    expect(mockStorage.set).toHaveBeenCalledWith("devToolsEnabled", true)
  })

  it("turns the mirrored flag off when the flag is removed", async () => {
    await syncDevToolsFlag()

    expect(mockStorage.set).toHaveBeenCalledWith("devToolsEnabled", false)
  })
})
