import { describe, test, expect, vi, beforeEach } from "vitest"
import {
  cn,
  generateUUIDFromObject,
  isEmpty,
  isSearchCommand,
  isPageActionCommand,
  sortUrlsByDomain,
  onHover,
  capitalize,
  sleep,
} from "./utils"
import { OPEN_MODE } from "@/const"
import type { SearchCommand, PageActionCommand } from "@/types"

describe("Utility Functions", () => {
  describe("cn function", () => {
    test("UTIL-01: Normal case: classname concatenation works correctly", () => {
      // Arrange
      const class1 = "btn"
      const class2 = "btn-primary"

      // Act
      const result = cn(class1, class2)

      // Assert
      expect(result).toBe("btn btn-primary")
    })

    test("UTIL-02: Normal case: conditional classnames are processed correctly", () => {
      // Arrange
      const baseClass = "btn"
      const conditionalClass = true && "active"

      // Act
      const result = cn(baseClass, conditionalClass)

      // Assert
      expect(result).toBe("btn active")
    })

    test("UTIL-03: Edge case: empty strings, null, and undefined are handled correctly", () => {
      // Arrange & Act & Assert
      expect(cn()).toBe("")
      expect(cn("")).toBe("")
      expect(cn(null)).toBe("")
      expect(cn(undefined)).toBe("")
    })
  })

  describe("generateUUIDFromObject function", () => {
    test("UTIL-04: Normal case: unique UUID is generated from object", () => {
      // Arrange
      const obj1 = { name: "test", value: 123 }
      const obj2 = { name: "test", value: 123 }
      const obj3 = { name: "different", value: 456 }

      // Act
      const uuid1 = generateUUIDFromObject(obj1)
      const uuid2 = generateUUIDFromObject(obj2)
      const uuid3 = generateUUIDFromObject(obj3)

      // Assert
      expect(uuid1).toBe(uuid2) // Same objects produce same UUID
      expect(uuid1).not.toBe(uuid3) // Different objects produce different UUID
      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ) // UUIDv5 format
    })

    test("UTIL-05: Edge case: UUID is correctly generated for empty object", () => {
      // Arrange
      const emptyObj = {}

      // Act
      const uuid = generateUUIDFromObject(emptyObj)

      // Assert
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    })
  })

  describe("isEmpty function", () => {
    test("UTIL-06: Normal case: returns true for empty string", () => {
      // Act & Assert
      expect(isEmpty("")).toBe(true)
    })

    test("UTIL-07: Normal case: returns false when string exists", () => {
      // Act & Assert
      expect(isEmpty("hello")).toBe(false)
      expect(isEmpty(" ")).toBe(false) // Space is treated as a character
    })

    test("UTIL-08: Edge case: returns true for null and undefined", () => {
      // Act & Assert
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
    })
  })

  describe("isSearchCommand function", () => {
    test("UTIL-09: Normal case: returns true for valid SearchCommand", () => {
      // Arrange
      const searchCommand: SearchCommand = {
        id: "test-id",
        title: "Test Command",
        description: "Test Description",
        tags: [],
        addedAt: "2024-01-01",
        openMode: OPEN_MODE.POPUP,
        searchUrl: "https://example.com",
        iconUrl: "https://example.com/icon.ico",
        openModeSecondary: OPEN_MODE.TAB,
        spaceEncoding: "plus" as any,
      }

      // Act & Assert
      expect(isSearchCommand(searchCommand)).toBe(true)
    })

    test("UTIL-10: Normal case: returns true for various OPEN modes", () => {
      // Arrange
      const popupCommand = { openMode: OPEN_MODE.POPUP }
      const tabCommand = { openMode: OPEN_MODE.TAB }
      const windowCommand = { openMode: OPEN_MODE.WINDOW }

      // Act & Assert
      expect(isSearchCommand(popupCommand)).toBe(true)
      expect(isSearchCommand(tabCommand)).toBe(true)
      expect(isSearchCommand(windowCommand)).toBe(true)
    })

    test("UTIL-11: Error case: returns false for invalid objects", () => {
      // Arrange
      const invalidCommand = { openMode: OPEN_MODE.PAGE_ACTION }
      const emptyObject = {}

      // Act & Assert
      expect(isSearchCommand(invalidCommand)).toBe(false)
      expect(isSearchCommand(emptyObject)).toBe(false)
      expect(isSearchCommand(null)).toBe(false)
    })
  })

  describe("isPageActionCommand function", () => {
    test("UTIL-12: Normal case: returns true for valid PageActionCommand", () => {
      // Arrange
      const pageActionCommand: PageActionCommand = {
        id: "test-id",
        title: "Test Command",
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
      }

      // Act & Assert
      expect(isPageActionCommand(pageActionCommand)).toBe(true)
    })

    test("UTIL-13: Error case: returns false for invalid objects", () => {
      // Arrange
      const searchCommand = { openMode: OPEN_MODE.POPUP }
      const emptyObject = {}

      // Act & Assert
      expect(isPageActionCommand(searchCommand)).toBe(false)
      expect(isPageActionCommand(emptyObject)).toBe(false)
      expect(isPageActionCommand(null)).toBe(false)
    })
  })

  describe("sortUrlsByDomain function", () => {
    test("UTIL-14: Normal case: sorted by domain name", () => {
      // Arrange
      const urls = [
        { url: "https://zzz.example.com" },
        { url: "https://aaa.example.com" },
        { url: "https://bbb.example.com" },
      ]

      // Act
      const sorted = sortUrlsByDomain(urls, (item) => item.url)

      // Assert
      expect(sorted[0].url).toBe("https://aaa.example.com")
      expect(sorted[1].url).toBe("https://bbb.example.com")
      expect(sorted[2].url).toBe("https://zzz.example.com")
    })

    test("UTIL-15: Normal case: sorted by different domains", () => {
      // Arrange
      const urls = [
        { url: "https://zebra.com" },
        { url: "https://apple.com" },
        { url: "https://microsoft.com" },
      ]

      // Act
      const sorted = sortUrlsByDomain(urls, (item) => item.url)

      // Assert
      expect(sorted[0].url).toBe("https://apple.com")
      expect(sorted[1].url).toBe("https://microsoft.com")
      expect(sorted[2].url).toBe("https://zebra.com")
    })

    test("UTIL-16: Edge case: returns empty array for empty array", () => {
      // Arrange
      const emptyArray: { url: string }[] = []

      // Act
      const sorted = sortUrlsByDomain(emptyArray, (item) => item.url)

      // Assert
      expect(sorted).toEqual([])
    })
  })

  describe("onHover function", () => {
    beforeEach(() => {
      vi.clearAllTimers()
      vi.useFakeTimers()
    })

    test("UTIL-17: Normal case: mouse event callbacks are set correctly", () => {
      // Arrange
      const mockFunc = vi.fn()
      const enterVal = "entered"
      const leaveVal = "left"

      // Act
      const callbacks = onHover(mockFunc, enterVal, { leaveVal })

      // Assert
      expect(callbacks).toHaveProperty("onMouseEnter")
      expect(callbacks).toHaveProperty("onMouseLeave")

      // Callback execution test
      callbacks.onMouseEnter()
      expect(mockFunc).toHaveBeenCalledWith(enterVal)

      callbacks.onMouseLeave()
      expect(mockFunc).toHaveBeenCalledWith(leaveVal)
    })

    test("UTIL-18: Normal case: works correctly with delay setting", () => {
      // Arrange
      const mockFunc = vi.fn()
      const enterVal = "delayed"
      const delay = 1000

      // Act
      const callbacks = onHover(mockFunc, enterVal, { delay })

      callbacks.onMouseEnter()
      expect(mockFunc).not.toHaveBeenCalled() // Not called yet

      // Time elapsed
      vi.advanceTimersByTime(delay)

      // Assert
      expect(mockFunc).toHaveBeenCalledWith(enterVal)
    })

    test("UTIL-19: Normal case: boolean value auto-completion works correctly", () => {
      // Arrange
      const mockFunc = vi.fn()
      const enterVal = true

      // Act
      const callbacks = onHover(mockFunc, enterVal)

      callbacks.onMouseEnter()
      expect(mockFunc).toHaveBeenCalledWith(true)

      callbacks.onMouseLeave()
      expect(mockFunc).toHaveBeenCalledWith(false) // Auto-completion
    })
  })

  describe("capitalize function", () => {
    test("UTIL-20: Normal case: first letter of each word becomes uppercase", () => {
      // Arrange
      const phrase = "hello world test"

      // Act
      const result = capitalize(phrase)

      // Assert
      expect(result).toBe("Hello World Test")
    })

    test("UTIL-21: Normal case: mixed case strings are processed correctly", () => {
      // Arrange
      const phrase = "hELLo WoRLD"

      // Act
      const result = capitalize(phrase)

      // Assert
      expect(result).toBe("Hello World")
    })

    test("UTIL-22: Edge case: empty string, null, undefined are returned as-is", () => {
      // Act & Assert
      expect(capitalize("")).toBe("")
      expect(capitalize(null as any)).toBe(null)
      expect(capitalize(undefined as any)).toBe(undefined)
    })

    test("UTIL-23: Edge case: works correctly with single character", () => {
      // Act & Assert
      expect(capitalize("a")).toBe("A")
      expect(capitalize("A")).toBe("A")
    })
  })

  describe("sleep function", () => {
    beforeEach(() => {
      vi.clearAllTimers()
      vi.useFakeTimers()
    })

    test("UTIL-24: Normal case: Promise resolves after specified time", async () => {
      // Arrange
      const sleepTime = 1000
      const mockCallback = vi.fn()

      // Act
      const promise = sleep(sleepTime).then(mockCallback)

      // Not resolved yet
      expect(mockCallback).not.toHaveBeenCalled()

      // Time elapsed
      vi.advanceTimersByTime(sleepTime)

      // Wait for Promise resolution
      await promise

      // Assert
      expect(mockCallback).toHaveBeenCalled()
    })

    test("UTIL-25: Edge case: resolves immediately with 0 milliseconds", async () => {
      // Arrange
      const mockCallback = vi.fn()

      // Act
      const promise = sleep(0).then(mockCallback)
      vi.advanceTimersByTime(0)
      await promise

      // Assert
      expect(mockCallback).toHaveBeenCalled()
    })
  })
})
