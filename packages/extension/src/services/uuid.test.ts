import { describe, it, expect } from "vitest"
import { cmd2uuid } from "./uuid"
import { OPEN_MODE, SPACE_ENCODING } from "@/const"
import type { CommandContent } from "@/types/command"

describe("UUID Service", () => {
  describe("cmd2uuid - internal object processing", () => {
    it("UUID-01: should generate the same UUID for identical SearchCommands", async () => {
      const command: CommandContent = {
        title: "Test Search",
        searchUrl: "https://example.com/search?q=%s",
        iconUrl: "https://example.com/icon.png",
        openMode: OPEN_MODE.TAB,
      }

      const uuid1 = await cmd2uuid(command)
      const uuid2 = await cmd2uuid(command)

      expect(uuid1).toBe(uuid2)
    })

    it("UUID-02: should generate different UUIDs for different SearchCommands", async () => {
      const command1: CommandContent = {
        title: "Test Search 1",
        searchUrl: "https://example.com/search?q=%s",
        iconUrl: "https://example.com/icon.png",
        openMode: OPEN_MODE.TAB,
      }

      const command2: CommandContent = {
        title: "Test Search 2", // Different title
        searchUrl: "https://example.com/search?q=%s",
        iconUrl: "https://example.com/icon.png",
        openMode: OPEN_MODE.TAB,
      }

      const uuid1 = await cmd2uuid(command1)
      const uuid2 = await cmd2uuid(command2)

      expect(uuid1).not.toBe(uuid2)
    })

    it("UUID-03: should generate the same UUID regardless of property order in objects", async () => {
      // This is tested implicitly through the normalizeObject function usage
      // We verify that identical commands produce identical UUIDs
      const baseProperties = {
        title: "Property Order Test",
        searchUrl: "https://example.com/search?q=%s",
        iconUrl: "https://example.com/icon.png",
        openMode: OPEN_MODE.TAB,
        spaceEncoding: SPACE_ENCODING.PLUS,
      }

      // Create command with same properties in different order
      const command1: CommandContent = {
        title: baseProperties.title,
        openMode: baseProperties.openMode,
        iconUrl: baseProperties.iconUrl,
        searchUrl: baseProperties.searchUrl,
        spaceEncoding: baseProperties.spaceEncoding,
      }

      const command2: CommandContent = {
        spaceEncoding: baseProperties.spaceEncoding,
        searchUrl: baseProperties.searchUrl,
        iconUrl: baseProperties.iconUrl,
        openMode: baseProperties.openMode,
        title: baseProperties.title,
      }

      const uuid1 = await cmd2uuid(command1)
      const uuid2 = await cmd2uuid(command2)

      expect(uuid1).toBe(uuid2)
    })

    it("UUID-04: should generate a valid UUIDv5 format", async () => {
      const command: CommandContent = {
        title: "UUID Format Test",
        iconUrl: "https://example.com/icon.png",
        openMode: OPEN_MODE.TAB,
      }

      const uuid = await cmd2uuid(command)

      // UUIDv5 format: xxxxxxxx-xxxx-5xxx-xxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuid).toMatch(uuidRegex)
    })
  })

  describe("cmd2uuid", () => {
    describe("SearchCommand", () => {
      it("UUID-05: should generate correct UUID for SearchCommand", async () => {
        const searchCommand: CommandContent = {
          title: "Google Search",
          searchUrl: "https://www.google.com/search?q=%s",
          iconUrl: "https://www.google.com/favicon.ico",
          openMode: OPEN_MODE.TAB,
          openModeSecondary: OPEN_MODE.WINDOW,
          spaceEncoding: SPACE_ENCODING.PLUS,
        }

        const uuid = await cmd2uuid(searchCommand)

        expect(typeof uuid).toBe("string")
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
      })

      it("UUID-06: should generate UUID with minimal SearchCommand properties", async () => {
        const minimalSearchCommand: CommandContent = {
          title: "Minimal Search",
          iconUrl: "",
          openMode: OPEN_MODE.TAB,
        }

        const uuid = await cmd2uuid(minimalSearchCommand)

        expect(typeof uuid).toBe("string")
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
      })

      it("UUID-07: should generate UUID with all SearchCommand properties", async () => {
        const fullSearchCommand: CommandContent = {
          title: "Full Search Command",
          searchUrl: "https://example.com/search?q=%s",
          iconUrl: "https://example.com/icon.png",
          openMode: OPEN_MODE.TAB,
          openModeSecondary: OPEN_MODE.WINDOW,
          spaceEncoding: SPACE_ENCODING.PERCENT,
          parentFolderId: "folder-123",
        }

        const uuid = await cmd2uuid(fullSearchCommand)

        expect(typeof uuid).toBe("string")
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
      })

      it("UUID-08: should consistently generate same UUID for identical SearchCommand", async () => {
        const searchCommand: CommandContent = {
          title: "Consistent Search",
          searchUrl: "https://example.com/search?q=%s",
          iconUrl: "https://example.com/icon.png",
          openMode: OPEN_MODE.TAB,
        }

        const uuid1 = await cmd2uuid(searchCommand)
        const uuid2 = await cmd2uuid(searchCommand)

        expect(uuid1).toBe(uuid2)
      })
    })

    describe("PageActionCommand", () => {
      it("UUID-09: should generate correct UUID for PageActionCommand", async () => {
        const pageActionCommand = {
          title: "Page Action Test",
          iconUrl: "https://example.com/icon.png",
          openMode: OPEN_MODE.PAGE_ACTION,
          pageActionOption: {
            startUrl: "https://example.com",
            openMode: "tab",
            steps: [{ type: "click", selector: "#button" }],
          },
        } as CommandContent

        const uuid = await cmd2uuid(pageActionCommand)

        expect(typeof uuid).toBe("string")
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
      })

      it("UUID-10: should generate different UUIDs for different pageActionOptions", async () => {
        const baseCommand = {
          title: "Page Action Base",
          iconUrl: "https://example.com/icon.png",
          openMode: OPEN_MODE.PAGE_ACTION,
        }

        const command1 = {
          ...baseCommand,
          pageActionOption: {
            startUrl: "https://example1.com",
            openMode: "tab",
            steps: [{ type: "click", selector: "#button1" }],
          },
        } as CommandContent

        const command2 = {
          ...baseCommand,
          pageActionOption: {
            startUrl: "https://example2.com",
            openMode: "tab",
            steps: [{ type: "click", selector: "#button2" }],
          },
        } as CommandContent

        const uuid1 = await cmd2uuid(command1)
        const uuid2 = await cmd2uuid(command2)

        expect(uuid1).not.toBe(uuid2)
      })

      it("UUID-11: should consistently generate same UUID for identical PageActionCommand", async () => {
        const pageActionCommand = {
          title: "Consistent Page Action",
          iconUrl: "https://example.com/icon.png",
          openMode: OPEN_MODE.PAGE_ACTION,
          pageActionOption: {
            startUrl: "https://example.com",
            openMode: "tab",
            steps: [
              { type: "click", selector: "#submit" },
              { type: "wait", duration: 1000 },
            ],
          },
        } as CommandContent

        const uuid1 = await cmd2uuid(pageActionCommand)
        const uuid2 = await cmd2uuid(pageActionCommand)

        expect(uuid1).toBe(uuid2)
      })

      it("UUID-14: Generate the same UUID as the Selection command Hub.", async () => {
        const pageActionCommand = {
          title: "Page Action Example",
          iconUrl: "https://example.com/icon.png",
          openMode: OPEN_MODE.PAGE_ACTION,
          pageActionOption: {
            startUrl: "https://example.com",
            openMode: "tab",
            steps: [
              { id: "gmavyqlj2", type: "click", selector: "#submit" },
              { id: "umb7r0prx", type: "wait", duration: 1000 },
            ],
          },
        } as CommandContent

        const uuid = await cmd2uuid(pageActionCommand)

        // This UUID should match the one generated in the Selection command Hub's test case: CH-14
        expect(uuid).toBe("3b6529de-daa9-5832-9597-090d260b81aa")
      })
    })

    describe("Error Handling", () => {
      it("UUID-12: should throw error for invalid command type", async () => {
        const invalidCommand = {
          title: "Invalid Command",
          iconUrl: "https://example.com/icon.png",
          openMode: "INVALID_MODE" as any,
        }

        await expect(cmd2uuid(invalidCommand)).rejects.toThrow(
          "Invalid command",
        )
      })

      it("UUID-13: should handle null and undefined commands", async () => {
        await expect(cmd2uuid(null as any)).rejects.toThrow()
        await expect(cmd2uuid(undefined as any)).rejects.toThrow()
      })
    })
  })
})
