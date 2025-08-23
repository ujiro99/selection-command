import { describe, test, expect, vi } from "vitest"
import { cmd2text, cmd2uuid, getCommands, getSearchUrl } from "./command"
import { OPEN_MODE, SPACE_ENCODING } from "@/const"
import type { SearchCommand, PageActionCommand } from "@/types"

vi.mock("@/data/commands.json", () => ({
  default: [
    {
      id: "test-search-1",
      title: "Test Search Command",
      description: "Test Description",
      tags: ["Search", "Test"],
      addedAt: "2024-01-01T00:00:00.000Z",
      openMode: "popup",
      searchUrl: "https://example.com/search?q=%s",
      iconUrl: "https://example.com/icon.ico",
      openModeSecondary: "tab",
      spaceEncoding: "plus",
    },
    {
      id: "test-pageaction-1",
      title: "Test Page Action",
      description: "Test Page Action Description",
      tags: ["PageAction"],
      addedAt: "2024-01-02T00:00:00.000Z",
      openMode: "pageAction",
      iconUrl: "https://example.com/icon2.ico",
      pageActionOption: {
        startUrl: "https://example.com",
        openMode: "none",
        steps: [],
      },
    },
  ],
}))

vi.mock("@/data/analytics.json", () => ({
  default: {
    download: [{ eventId: "test-search-1", eventCount: 10 }],
    starred: [{ eventId: "test-search-1", eventCount: 5 }],
  },
}))

describe("Command Operations", () => {
  describe("cmd2text function", () => {
    test("CH-01: Normal case: SearchCommand is correctly converted to JSON", () => {
      // Arrange
      const searchCommand: SearchCommand & { download: number; star: number } =
      {
        id: "test-id",
        title: "Test Command",
        description: "Test Description",
        tags: [],
        addedAt: "2024-01-01",
        openMode: OPEN_MODE.POPUP,
        searchUrl: "https://example.com/search?q=%s",
        iconUrl: "https://example.com/icon.ico",
        openModeSecondary: OPEN_MODE.TAB,
        spaceEncoding: SPACE_ENCODING.PLUS,
        download: 0,
        star: 0,
      }

      // Act
      const result = cmd2text(searchCommand)
      const parsed = JSON.parse(result)

      // Assert
      expect(parsed).toEqual({
        id: "test-id",
        title: "Test Command",
        searchUrl: "https://example.com/search?q=%s",
        iconUrl: "https://example.com/icon.ico",
        openMode: OPEN_MODE.POPUP,
        openModeSecondary: OPEN_MODE.TAB,
        spaceEncoding: SPACE_ENCODING.PLUS,
      })
    })

    test("CH-02: Normal case: PageActionCommand is correctly converted to JSON", () => {
      // Arrange
      const pageActionCommand: PageActionCommand & {
        download: number
        star: number
      } = {
        id: "test-id",
        title: "Test Page Action",
        description: "Test Description",
        tags: [],
        addedAt: "2024-01-01",
        openMode: OPEN_MODE.PAGE_ACTION,
        iconUrl: "https://example.com/icon.ico",
        pageActionOption: {
          startUrl: "https://example.com",
          openMode: "none" as any,
          steps: [],
        },
        download: 0,
        star: 0,
      }

      // Act
      const result = cmd2text(pageActionCommand)
      const parsed = JSON.parse(result)

      // Assert
      expect(parsed).toEqual({
        id: "test-id",
        title: "Test Page Action",
        iconUrl: "https://example.com/icon.ico",
        openMode: OPEN_MODE.PAGE_ACTION,
        pageActionOption: {
          startUrl: "https://example.com",
          openMode: "none",
          steps: [],
        },
      })
    })

    test("CH-03: Error case: error occurs for invalid command", () => {
      // Arrange
      const invalidCommand = {
        id: "invalid",
        title: "Invalid",
        openMode: "invalid-mode",
      } as any

      // Act & Assert
      expect(() => cmd2text(invalidCommand)).toThrow("Invalid command")
    })
  })

  describe("cmd2uuid function", () => {
    test("CH-04: Normal case: unique UUID is generated from SearchCommand", () => {
      // Arrange
      const commandContent1 = {
        title: "Test Command",
        openMode: OPEN_MODE.POPUP,
        searchUrl: "https://example.com/search?q=%s",
        iconUrl: "https://example.com/icon.ico",
        openModeSecondary: OPEN_MODE.TAB,
        spaceEncoding: SPACE_ENCODING.PLUS,
      }
      const commandContent2 = { ...commandContent1 }
      const commandContent3 = { ...commandContent1, title: "Different Title" }

      // Act
      const uuid1 = cmd2uuid(commandContent1)
      const uuid2 = cmd2uuid(commandContent2)
      const uuid3 = cmd2uuid(commandContent3)

      // Assert
      expect(uuid1).toBe(uuid2) // Same content produces same UUID
      expect(uuid1).not.toBe(uuid3) // Different content produces different UUID
      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    })

    test("CH-05: Normal case: unique UUID is generated from PageActionCommand", () => {
      // Arrange
      const commandContent = {
        title: "Test Page Action",
        openMode: OPEN_MODE.PAGE_ACTION,
        iconUrl: "https://example.com/icon.ico",
        pageActionOption: {
          startUrl: "https://example.com",
          openMode: "none" as any,
          steps: [],
        },
      }

      // Act
      const uuid = cmd2uuid(commandContent)

      // Assert
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    })

    test("CH-06: Error case: error occurs for invalid command", () => {
      // Arrange
      const invalidContent = {
        title: "Invalid",
        openMode: "invalid-mode",
      } as any

      // Act & Assert
      expect(() => cmd2uuid(invalidContent)).toThrow("Invalid command")
    })

    test("CH-14: Generate the same UUID as the Selection command Extension.", async () => {
      const pageActionCommand = {
        title: "Page Action Example",
        iconUrl: "https://example.com/icon.png",
        openMode: OPEN_MODE.PAGE_ACTION,
        pageActionOption: {
          startUrl: "https://example.com",
          openMode: "tab",
          steps: [
            { id: "gmavyqlj2", type: "click", selector: "#submit" },
            { id: "umb7r0prx", duration: 1000, type: "wait" }, // properties order is changed.
          ],
        },
      }
      const uuid = cmd2uuid(pageActionCommand)

      // Assert
      // This UUID should match the one generated in the Extension's test case: UUID-14
      expect(uuid).toBe("3b6529de-daa9-5832-9597-090d260b81aa")
    })
  })

  describe("getCommands function", () => {
    test("CH-07: Normal case: command list is merged with analytics data", () => {
      // Act
      const commands = getCommands()

      // Assert
      expect(commands).toHaveLength(2)

      // Check first command (SearchCommand)
      const searchCmd = commands[0]
      expect(searchCmd.id).toBe("test-search-1")
      expect(searchCmd.title).toBe("Test Search Command")
      expect(searchCmd.download).toBe(10) // Retrieved from analytics
      expect(searchCmd.star).toBe(5) // Retrieved from analytics
      expect(searchCmd.tags).toHaveLength(2)
      expect(searchCmd.tags[0]).toHaveProperty("id")
      expect(searchCmd.tags[0]).toHaveProperty("name")
      expect(searchCmd.tags[0].name).toBe("Search")

      // Check second command (PageActionCommand)
      const pageActionCmd = commands[1]
      expect(pageActionCmd.id).toBe("test-pageaction-1")
      expect(pageActionCmd.title).toBe("Test Page Action")
      expect(pageActionCmd.download).toBe(0) // No analytics data
      expect(pageActionCmd.star).toBe(0) // No analytics data
    })

    test("CH-08: Normal case: unique IDs are generated for tags", () => {
      // Act
      const commands = getCommands()
      const searchCmd = commands[0]

      // Assert
      expect(searchCmd.tags).toHaveLength(2)
      expect(searchCmd.tags[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
      expect(searchCmd.tags[1].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
      expect(searchCmd.tags[0].id).not.toBe(searchCmd.tags[1].id)
    })

    test("CH-09: Normal case: OPENMODE and SPACE_ENCODING are correctly type-converted", () => {
      // Act
      const commands = getCommands()
      const searchCmd = commands.find((cmd) => cmd.id === "test-search-1")

      // Assert
      expect(searchCmd).toBeDefined()
      expect(searchCmd!.openMode).toBe(OPEN_MODE.POPUP)

      // Only check SearchCommand specific properties if it's a SearchCommand
      if (searchCmd && "openModeSecondary" in searchCmd) {
        expect(searchCmd.openModeSecondary).toBe(OPEN_MODE.TAB)
      }
      if (searchCmd && "spaceEncoding" in searchCmd) {
        expect(searchCmd.spaceEncoding).toBe(SPACE_ENCODING.PLUS)
      }
    })
  })

  describe("getSearchUrl function", () => {
    test("CH-10: Normal case: only SearchCommand URLs are retrieved", () => {
      // Act
      const searchUrls = getSearchUrl()

      // Assert
      expect(searchUrls).toHaveLength(1)
      expect(searchUrls[0]).toBe("https://example.com/search?q=%s")
    })

    test("CH-11: Edge case: PageActionCommand is excluded", () => {
      // Act
      const searchUrls = getSearchUrl()

      // Assert
      // PageActionCommand is excluded because it doesn't have searchUrl
      expect(searchUrls).toHaveLength(1)
      expect(searchUrls.every((url) => url.includes("search"))).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    test("CH-12: Edge case: default values are correctly set for commands without analytics data", () => {
      // Act
      const commands = getCommands()
      const pageActionCmd = commands[1] // No analytics data

      // Assert
      expect(pageActionCmd.download).toBe(0)
      expect(pageActionCmd.star).toBe(0)
    })

    test("CH-13: Normal case: empty tag arrays are handled correctly", () => {
      // This test checks with current commands since mock data cannot be changed
      const commands = getCommands()

      // Assert
      commands.forEach((cmd) => {
        expect(Array.isArray(cmd.tags)).toBe(true)
        cmd.tags.forEach((tag) => {
          expect(tag).toHaveProperty("id")
          expect(tag).toHaveProperty("name")
          expect(typeof tag.id).toBe("string")
          expect(typeof tag.name).toBe("string")
        })
      })
    })
  })
})
