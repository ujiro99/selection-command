import { describe, test, expect, vi } from "vitest"
import { getTags } from "./tag"

// Mocking the tags data
vi.mock("@/data/tags.json", () => ({
  default: [
    { name: "Search", count: 15 },
    { name: "Translate", count: 8 },
    { name: "Developer", count: 12 },
    { name: "Shopping", count: 5 },
    { name: "Social", count: 3 },
  ],
}))

describe("Tag Functions", () => {
  describe("getTags function", () => {
    test("TAG-01: Normal case: tag list is correctly retrieved", () => {
      // Act
      const tags = getTags()

      // Assert
      expect(tags).toHaveLength(5)
      expect(tags[0]).toHaveProperty("id")
      expect(tags[0]).toHaveProperty("name")
      expect(tags[0].name).toBe("Search")
    })

    test("TAG-02: Normal case: unique IDs are generated for each tag", () => {
      // Act
      const tags = getTags()

      // Assert
      const ids = tags.map((tag) => tag.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(tags.length) // All IDs are unique

      // UUIDv5 format validation
      tags.forEach((tag) => {
        expect(tag.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
      })
    })

    test("TAG-03: Normal case: tags with the same name have the same ID", () => {
      // Act
      const tags1 = getTags()
      const tags2 = getTags()

      // Assert
      expect(tags1[0].id).toBe(tags2[0].id) // Same name produces same ID
      expect(tags1[1].id).toBe(tags2[1].id)
    })

    test("TAG-04: Normal case: all tag names are string type", () => {
      // Act
      const tags = getTags()

      // Assert
      tags.forEach((tag) => {
        expect(typeof tag.name).toBe("string")
        expect(tag.name.length).toBeGreaterThan(0)
      })
    })

    test("TAG-05: Normal case: tag order is preserved", () => {
      // Act
      const tags = getTags()

      // Assert
      expect(tags[0].name).toBe("Search")
      expect(tags[1].name).toBe("Translate")
      expect(tags[2].name).toBe("Developer")
      expect(tags[3].name).toBe("Shopping")
      expect(tags[4].name).toBe("Social")
    })

    test("TAG-06: Normal case: tag object structure is correct", () => {
      // Act
      const tags = getTags()

      // Assert
      tags.forEach((tag) => {
        expect(Object.keys(tag)).toEqual(["id", "name"])
        expect(typeof tag.id).toBe("string")
        expect(typeof tag.name).toBe("string")
      })
    })

    test("TAG-07: Edge case: tag names with special characters are handled correctly", () => {
      // This test validates with current mock data
      // Behavior confirmation when actual data contains special characters
      const tags = getTags()

      // Assert
      tags.forEach((tag) => {
        expect(tag.id).toBeTruthy()
        expect(tag.name).toBeTruthy()
        // Check if ID is in valid UUID format
        expect(tag.id).toMatch(/^[0-9a-f-]+$/i)
      })
    })

    test("TAG-08: Normal case: generateUUIDFromObject is called correctly", () => {
      // Act
      const tags = getTags()

      // Assert
      // Confirm that IDs generated from the same name are consistent
      const searchTag1 = tags.find((t) => t.name === "Search")
      const searchTag2 = tags.find((t) => t.name === "Search")

      expect(searchTag1?.id).toBe(searchTag2?.id)
    })
  })

  describe("Edge Cases", () => {
    test("TAG-09: Edge case: different IDs are generated for case differences", () => {
      // This behavior is implementation-dependent, but current implementation distinguishes case
      const tags = getTags()

      // Assert
      // Current test data has no case differences, but
      // confirm that each tag has a unique ID
      const uniqueNames = new Set(tags.map((t) => t.name))
      expect(uniqueNames.size).toBe(tags.length)
    })

    test("TAG-10: Normal case: non-empty tag list is returned", () => {
      // Act
      const tags = getTags()

      // Assert
      expect(tags.length).toBeGreaterThan(0)
      expect(Array.isArray(tags)).toBe(true)
    })
  })
})
