import { describe, it, expect } from "vitest"
import { COMMAND_SOURCE_TYPE } from "@/const"
import { resolveCommandSource, setCommandSource } from "./commandSource"

describe("commandSource", () => {
  it("returns existing source fields", () => {
    const source = resolveCommandSource({
      id: "cmd-1",
      sourceType: COMMAND_SOURCE_TYPE.HUB_COMMUNITY,
      sourceId: "hub-123",
    } as any)

    expect(source).toEqual({
      sourceType: COMMAND_SOURCE_TYPE.HUB_COMMUNITY,
      sourceId: "hub-123",
    })
  })

  it("falls back to unknown and command id", () => {
    const source = resolveCommandSource({
      id: "cmd-2",
    } as any)

    expect(source).toEqual({
      sourceType: COMMAND_SOURCE_TYPE.UNKNOWN,
      sourceId: "cmd-2",
    })
  })

  it("sets source fields with default sourceId", () => {
    const command = setCommandSource(
      {
        id: "cmd-3",
        openMode: "tab",
      } as any,
      COMMAND_SOURCE_TYPE.SELF_CREATED,
    )

    expect(command.sourceType).toBe(COMMAND_SOURCE_TYPE.SELF_CREATED)
    expect(command.sourceId).toBe("cmd-3")
  })
})
