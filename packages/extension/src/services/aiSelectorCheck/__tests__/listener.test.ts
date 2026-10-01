import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockAddListener, mockIsEnabled } = vi.hoisted(() => ({
  mockAddListener: vi.fn(),
  mockIsEnabled: vi.fn(),
}))

vi.mock("@/services/ipc", () => ({
  Ipc: { addListener: mockAddListener },
  TabCommand: { checkAiSelectors: "checkAiSelectors" },
}))
vi.mock("../devFlag", () => ({
  isDevToolsEnabledForContentScript: mockIsEnabled,
}))

import { registerAiSelectorCheckListener } from "../listener"

describe("registerAiSelectorCheckListener", () => {
  beforeEach(() => {
    mockAddListener.mockReset()
    mockIsEnabled.mockReset()
  })

  it("registers the listener when the dev tools are enabled", async () => {
    mockIsEnabled.mockResolvedValue(true)

    await registerAiSelectorCheckListener()

    expect(mockAddListener).toHaveBeenCalledWith(
      "checkAiSelectors",
      expect.any(Function),
    )
  })

  it("does not register the listener for regular users", async () => {
    mockIsEnabled.mockResolvedValue(false)

    await registerAiSelectorCheckListener()

    expect(mockAddListener).not.toHaveBeenCalled()
  })

  it("does not register the listener when the flag can't be read", async () => {
    mockIsEnabled.mockRejectedValue(new Error("context invalidated"))

    await registerAiSelectorCheckListener()

    expect(mockAddListener).not.toHaveBeenCalled()
  })
})
