import { describe, it, expect, vi, beforeEach } from "vitest"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { Settings } from "@/services/settings/settings"
import { incrementCommandExecutionCount } from "./commandMetrics"

// Mock dependencies
vi.mock("@/services/settings/enhancedSettings")
vi.mock("@/services/settings/settings")

const mockEnhancedSettings = vi.mocked(enhancedSettings)
const mockSettings = vi.mocked(Settings)

describe("Service Layer Migration", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockEnhancedSettings.get.mockResolvedValue({
      commands: [],
      folders: [],
      pageRules: [],
      stars: [],
      shortcuts: { shortcuts: [] },
      commandExecutionCount: 5,
      hasShownReviewRequest: false,
    } as any)

    mockSettings.update.mockResolvedValue(true)
  })

  it("MG-02-a: should call enhancedSettings.get() in commandMetrics and pass correct values to Settings.update", async () => {
    // Setup initial command execution count
    const initialCount = 10
    const expectedIncrementedCount = initialCount + 1

    mockEnhancedSettings.get.mockResolvedValue({
      commands: [],
      folders: [],
      pageRules: [],
      stars: [],
      shortcuts: { shortcuts: [] },
      commandExecutionCount: initialCount,
      hasShownReviewRequest: false,
    } as any)

    // Call the function
    await incrementCommandExecutionCount(123)

    // This should fail initially because the function still uses Settings.get() instead of enhancedSettings.get()
    expect(mockEnhancedSettings.get).toHaveBeenCalled()

    // Verify that Settings.update was called with the incremented count
    // The test expects the function to:
    // 1. Call enhancedSettings.get() to get current commandExecutionCount
    // 2. Increment the count by 1
    // 3. Call Settings.update() with the incremented value
    expect(mockSettings.update).toHaveBeenCalledWith(
      "commandExecutionCount", // COMMAND_USAGE.SETTING_KEY.COMMAND_EXECUTION_COUNT
      expect.any(Function),
      true,
    )

    // Verify the update function returns the incremented count
    const updateCall = mockSettings.update.mock.calls[0]
    const updateFunction = updateCall[1] as () => number
    expect(updateFunction()).toBe(expectedIncrementedCount)
  })
})
