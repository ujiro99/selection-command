import { describe, test, expect } from "vitest"
import { cmd2uuid, getCommands } from "./command"

describe("Command UUID Generation", () => {
  test("CH-15: Check current ids", async () => {
    for (const cmd of getCommands()) {
      const uuid = cmd2uuid(cmd)
      expect(uuid, `${cmd.title}`).toMatch(cmd.id)
    }
  })
})
