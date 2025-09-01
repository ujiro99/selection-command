import { describe, test, expect } from "vitest"
import { cmd2uuid, getCommands } from "./command"

describe("Command UUID Generation", () => {
  test("CH-15: Check current ids", async () => {
    for (const cmd of getCommands()) {
      if (cmd.revision > 0) {
        // Skip commands that have been revised
        continue
      }
      const uuid = cmd2uuid(cmd)
      expect(uuid, `${cmd.title}`).toMatch(cmd.id)
    }
  })
})
