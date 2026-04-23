import { describe, it, expect, vi, beforeEach } from "vitest"
import { OPEN_MODE, COMMAND_SOURCE_TYPE } from "@/const"
import { executeAction } from "./executor"
import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"

vi.mock("@/services/analytics", async () => {
  const actual = await vi.importActual("@/services/analytics")
  return {
    ...actual,
    sendEvent: vi.fn(),
  }
})

describe("executeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends command source params in analytics event", async () => {
    const execute = vi.fn().mockResolvedValue("ok")
    const actions = {
      [OPEN_MODE.TAB]: { execute },
    } as Record<string, { execute: () => Promise<string> }>

    await executeAction({
      actions,
      command: {
        id: "cmd-1",
        openMode: OPEN_MODE.TAB,
        sourceType: COMMAND_SOURCE_TYPE.HUB_COMMUNITY,
        sourceId: "hub-1",
      } as any,
      position: null,
      selectionText: "text",
    })

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.SELECTION_COMMAND,
      expect.objectContaining({
        command_id: "cmd-1",
        source_type: COMMAND_SOURCE_TYPE.HUB_COMMUNITY,
        source_id: "hub-1",
      }),
    )
  })

  it("falls back to unknown source values when command source is missing", async () => {
    const execute = vi.fn().mockResolvedValue("ok")
    const actions = {
      [OPEN_MODE.TAB]: { execute },
    } as Record<string, { execute: () => Promise<string> }>

    await executeAction({
      actions,
      command: {
        id: "cmd-2",
        openMode: OPEN_MODE.TAB,
      } as any,
      position: null,
      selectionText: "text",
    })

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.SELECTION_COMMAND,
      expect.objectContaining({
        command_id: "cmd-2",
        source_type: COMMAND_SOURCE_TYPE.UNKNOWN,
        source_id: undefined,
      }),
    )
  })
})
