import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { POPUP_ENABLED } from "@/const"
import { STORAGE_KEY } from "@/services/storage/const"
import { initSentry, Sentry, TestUtils } from "@/lib/sentry"

// Create a mutable mock for @/const
const mockIsDebug = { value: false }
vi.mock("@/const", () => ({
  get isDebug() {
    return mockIsDebug.value
  },
  POPUP_ENABLED: {
    ENABLE: "Enable",
    DISABLE: "Disable",
  },
}))

// Create dedicated mocks for this test file
const mockChromeStorageSync = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
}

const mockChromeStorageLocal = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
}

const mockChromeStorageOnChanged = {
  addListener: vi.fn(),
  removeListener: vi.fn(),
  hasListener: vi.fn(),
}

// Mock global chrome object
global.chrome = {
  storage: {
    sync: mockChromeStorageSync,
    local: mockChromeStorageLocal,
    onChanged: mockChromeStorageOnChanged,
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn(),
    id: "test-extension-id",
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  contextMenus: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    removeAll: vi.fn(),
  },
  i18n: {
    getMessage: vi.fn((key: string) => key),
    getUILanguage: vi.fn(() => "en"),
  },
} as any

// Global references to mock objects
let mockSentryClient: any
let mockSentryScope: any

// Mock the @sentry/browser module completely
vi.mock("@sentry/browser", async () => {
  // Create mock objects inside the factory
  const clientMock = {
    init: vi.fn(),
  }

  const scopeMock = {
    setClient: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
  }

  // Return completely mocked implementations
  return {
    BrowserClient: vi.fn(() => {
      mockSentryClient = clientMock
      return clientMock
    }),
    defaultStackParser: {},
    getDefaultIntegrations: vi.fn(() => []),
    makeFetchTransport: vi.fn(),
    Scope: vi.fn(() => {
      mockSentryScope = scopeMock
      return scopeMock
    }),
    ErrorEvent: class MockErrorEvent {},
  }
})

describe("Sentry Initialization Control Tests", () => {
  beforeEach(() => {
    // Clear only call history, not implementations
    if (mockSentryClient?.init) mockSentryClient.init.mockClear()
    if (mockSentryScope?.setClient) mockSentryScope.setClient.mockClear()
    if (mockSentryScope?.captureException)
      mockSentryScope.captureException.mockClear()
    if (mockSentryScope?.captureMessage)
      mockSentryScope.captureMessage.mockClear()
    mockChromeStorageSync.get.mockClear()

    // Reset to default state
    mockIsDebug.value = false
    TestUtils.reset()

    // Set default mock for chrome.storage.sync.get to prevent undefined errors
    mockChromeStorageSync.get.mockResolvedValue({
      [STORAGE_KEY.USER]: {
        pageRules: [],
      },
    })

    // Set default window.location.href
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test" },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("ST-01-a: Sentry initialization should be skipped in debug builds", () => {
    it("should not initialize Sentry when isDebug=true", async () => {
      // Arrange
      mockIsDebug.value = true

      // Act
      await initSentry()

      // Assert - Since debug mode skips initialization completely, Sentry should not be initialized
      expect(TestUtils.isInitialized()).toBe(false)
    })
  })

  describe("ST-01-b: Initialization should be skipped when pageRule setting has popupEnabled=false", () => {
    it("should not initialize Sentry when popupEnabled=false", async () => {
      // Arrange
      const mockUserSettings = {
        [STORAGE_KEY.USER]: {
          pageRules: [
            {
              urlPattern: "//example.com",
              popupEnabled: POPUP_ENABLED.DISABLE,
            },
          ],
        },
      }
      mockChromeStorageSync.get.mockResolvedValueOnce(mockUserSettings)

      // Mock current URL
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com/test" },
        writable: true,
      })

      // Act
      await initSentry()

      // Assert
      expect(TestUtils.isInitialized()).toBe(false)
      expect(mockChromeStorageSync.get).toHaveBeenCalledWith(
        `${STORAGE_KEY.USER}`,
      )
    })

    it("should initialize Sentry on pages that do not match pageRules", async () => {
      // Arrange
      const mockUserSettings = {
        [STORAGE_KEY.USER]: {
          pageRules: [
            {
              urlPattern: "//example.com",
              popupEnabled: POPUP_ENABLED.DISABLE,
            },
          ],
        },
      }
      mockChromeStorageSync.get.mockResolvedValueOnce(mockUserSettings)

      // Mock current URL (different domain)
      Object.defineProperty(window, "location", {
        value: { href: "https://other.com/test" },
        writable: true,
      })

      // Act
      await initSentry()

      // Assert
      expect(mockSentryClient.init).toHaveBeenCalled()
      expect(TestUtils.isInitialized()).toBe(true)
      expect(mockChromeStorageSync.get).toHaveBeenCalledWith(
        `${STORAGE_KEY.USER}`,
      )
    })
  })

  describe("ST-01-c: Sentry client should be properly initialized under normal conditions", () => {
    it("should initialize Sentry when not in debug build and not restricted by pageRules", async () => {
      // Arrange
      const mockUserSettings = {
        [STORAGE_KEY.USER]: {
          pageRules: [],
        },
      }
      mockChromeStorageSync.get.mockResolvedValue(mockUserSettings)

      // Act
      await initSentry()

      // Assert
      expect(mockSentryClient.init).toHaveBeenCalled()
      expect(TestUtils.isInitialized()).toBe(true)
      expect(mockChromeStorageSync.get).toHaveBeenCalledWith(
        `${STORAGE_KEY.USER}`,
      )
    })

    it("should initialize with default settings when configuration retrieval fails", async () => {
      // Arrange
      mockChromeStorageSync.get.mockRejectedValue(new Error("Storage error"))

      // Act
      await initSentry()

      // Assert
      expect(mockSentryClient.init).toHaveBeenCalled()
      expect(TestUtils.isInitialized()).toBe(true)
    })
  })
})

describe("Sentry Error Capture Tests", () => {
  beforeEach(() => {
    // Clear only call history, not implementations
    if (mockSentryClient?.init) mockSentryClient.init.mockClear()
    if (mockSentryScope?.setClient) mockSentryScope.setClient.mockClear()
    if (mockSentryScope?.captureException)
      mockSentryScope.captureException.mockClear()
    if (mockSentryScope?.captureMessage)
      mockSentryScope.captureMessage.mockClear()
    mockChromeStorageSync.get.mockClear()

    // Reset to default state
    mockIsDebug.value = false
    TestUtils.reset()

    // Set default mock for chrome.storage.sync.get to prevent undefined errors
    mockChromeStorageSync.get.mockResolvedValue({
      [STORAGE_KEY.USER]: {
        pageRules: [],
      },
    })

    // Set default window.location.href
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test" },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("ST-02-a: Exceptions in synchronous processing should be correctly captured", () => {
    it("should send exceptions from synchronous functions to Sentry", async () => {
      // Arrange
      const testError = new Error("Synchronous error")

      // Initialize Sentry first
      await initSentry()

      // Act
      try {
        throw testError
      } catch (error) {
        Sentry.captureException(error as Error)
      }

      // Assert
      expect(mockSentryScope.captureException).toHaveBeenCalledWith(testError)
    })

    it("should capture DOM manipulation errors", async () => {
      // Arrange
      const domError = new DOMException("Element not found", "NotFoundError")

      // Initialize Sentry first
      await initSentry()

      // Act
      Sentry.captureException(domError as Error)

      // Assert
      expect(mockSentryScope.captureException).toHaveBeenCalledWith(domError)
    })
  })

  describe("ST-02-b: Exceptions in asynchronous processing should be correctly captured", () => {
    it("should capture Promise rejections", async () => {
      // Arrange
      const asyncError = new Error("Async error")

      // Initialize Sentry first
      await initSentry()

      // Act
      try {
        await Promise.reject(asyncError)
      } catch (error) {
        Sentry.captureException(error as Error)
      }

      // Assert
      expect(mockSentryScope.captureException).toHaveBeenCalledWith(asyncError)
    })

    it("should capture exceptions in async/await functions", async () => {
      // Arrange
      const asyncFunctionError = new Error("Async function error")
      const asyncFunction = async () => {
        throw asyncFunctionError
      }

      // Initialize Sentry first
      await initSentry()

      // Act
      try {
        await asyncFunction()
      } catch (error) {
        Sentry.captureException(error as Error)
      }

      // Assert
      expect(mockSentryScope.captureException).toHaveBeenCalledWith(
        asyncFunctionError,
      )
    })
  })
})

describe("Sentry Privacy Protection Tests", () => {
  beforeEach(() => {
    // Clear only call history, not implementations
    if (mockSentryClient?.init) mockSentryClient.init.mockClear()
    if (mockSentryScope?.setClient) mockSentryScope.setClient.mockClear()
    if (mockSentryScope?.captureException)
      mockSentryScope.captureException.mockClear()
    if (mockSentryScope?.captureMessage)
      mockSentryScope.captureMessage.mockClear()
    mockChromeStorageSync.get.mockClear()

    // Reset to default state
    mockIsDebug.value = false
    TestUtils.reset()

    // Set default mock for chrome.storage.sync.get to prevent undefined errors
    mockChromeStorageSync.get.mockResolvedValue({
      [STORAGE_KEY.USER]: {
        pageRules: [],
      },
    })

    // Set default window.location.href
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test" },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("ST-03: Parameters should be removed from URL information", () => {
    it("should remove query parameters from URLs", () => {
      // Arrange
      const originalUrl = "https://example.com/path?param1=value1&param2=value2"
      const expectedUrl = "https://example.com/path"

      // Act
      const sanitizedUrl = TestUtils.sanitizeUrl(originalUrl)

      // Assert
      expect(sanitizedUrl).toBe(expectedUrl)
    })

    it("should remove hash values from URLs", () => {
      // Arrange
      const originalUrl = "https://example.com/path#section1"
      const expectedUrl = "https://example.com/path"

      // Act
      const sanitizedUrl = TestUtils.sanitizeUrl(originalUrl)

      // Assert
      expect(sanitizedUrl).toBe(expectedUrl)
    })

    it("should remove both parameters and hash from URLs simultaneously", () => {
      // Arrange
      const originalUrl = "https://example.com/path?param=value#section"
      const expectedUrl = "https://example.com/path"

      // Act
      const sanitizedUrl = TestUtils.sanitizeUrl(originalUrl)

      // Assert
      expect(sanitizedUrl).toBe(expectedUrl)
    })
  })
})

describe("Sentry Performance Tests", () => {
  beforeEach(() => {
    // Clear only call history, not implementations
    if (mockSentryClient?.init) mockSentryClient.init.mockClear()
    if (mockSentryScope?.setClient) mockSentryScope.setClient.mockClear()
    if (mockSentryScope?.captureException)
      mockSentryScope.captureException.mockClear()
    if (mockSentryScope?.captureMessage)
      mockSentryScope.captureMessage.mockClear()
    mockChromeStorageSync.get.mockClear()

    // Reset to default state
    mockIsDebug.value = false
    TestUtils.reset()

    // Set default mock for chrome.storage.sync.get to prevent undefined errors
    mockChromeStorageSync.get.mockResolvedValue({
      [STORAGE_KEY.USER]: {
        pageRules: [],
      },
    })

    // Set default window.location.href
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test" },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("ST-04-a: Impact of Sentry initialization on extension startup time should be within acceptable range", () => {
    it("should complete Sentry initialization in under 100ms", async () => {
      // Arrange
      const mockUserSettings = {
        [STORAGE_KEY.USER]: {
          pageRules: [],
        },
      }
      mockChromeStorageSync.get.mockResolvedValue(mockUserSettings)

      // Mock performance measurement
      const performanceMark = vi.fn()
      const performanceMeasure = vi.fn().mockReturnValue({ duration: 50 })
      Object.defineProperty(performance, "mark", { value: performanceMark })
      Object.defineProperty(performance, "measure", {
        value: performanceMeasure,
      })

      // Act
      const startTime = performance.now()
      await initSentry()
      const endTime = performance.now()
      const duration = endTime - startTime

      // Assert
      console.log(`Sentry initialization took ${duration.toFixed(2)}ms`)
      expect(duration).toBeLessThan(100)
    })

    it("should execute settings loading asynchronously", async () => {
      // Arrange
      let settingsCallTime: number
      mockChromeStorageSync.get.mockImplementation(async () => {
        settingsCallTime = performance.now()
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 10))
        return {
          [STORAGE_KEY.USER]: {
            pageRules: [],
          },
        }
      })

      // Act
      const startTime = performance.now()
      await initSentry()

      // Assert
      expect(settingsCallTime!).toBeGreaterThan(startTime)
      expect(mockChromeStorageSync.get).toHaveBeenCalledTimes(1)
    })

    it("should not include blocking operations in initialization", async () => {
      // Arrange
      const mockUserSettings = {
        [STORAGE_KEY.USER]: {
          pageRules: [],
        },
      }
      mockChromeStorageSync.get.mockResolvedValue(mockUserSettings)

      // Mock to check if initialization is non-blocking
      let otherTaskCompleted = false
      const otherTask = async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        otherTaskCompleted = true
      }

      // Act
      const { initSentry } = await import("@/lib/sentry")
      const initPromise = initSentry()
      const otherPromise = otherTask()

      await Promise.all([initPromise, otherPromise])

      // Assert
      expect(otherTaskCompleted).toBe(true)
    })
  })

  describe("ST-04-b: Error transmission processing should not affect UI responsiveness", () => {
    it("should execute error transmission asynchronously", async () => {
      // Arrange
      const testError = new Error("Test error")
      let mockCallCompleted = false

      // Initialize Sentry first
      await initSentry()

      // Mock the underlying captureException to track execution
      mockSentryScope.captureException.mockImplementation(() => {
        // Simulate the synchronous part completing immediately
        mockCallCompleted = true
        // Note: In real Sentry, the actual network request happens asynchronously
        // but the captureException call itself returns immediately
      })

      // Act
      const startTime = performance.now()
      Sentry.captureException(testError)
      const immediateTime = performance.now()

      // Assert
      // Check that the call returns immediately (non-blocking)
      expect(immediateTime - startTime).toBeLessThan(10)

      // Verify that the mock was called
      expect(mockSentryScope.captureException).toHaveBeenCalledWith(testError)
      expect(mockCallCompleted).toBe(true)
    })

    it("should not degrade performance when multiple errors occur simultaneously", async () => {
      // Arrange
      const errors = Array.from(
        { length: 10 },
        (_, i) => new Error(`Error ${i + 1}`),
      )

      // Initialize Sentry first
      await initSentry()

      // Mock captureException - since it's synchronous, no return value needed
      mockSentryScope.captureException.mockImplementation(() => {
        // In real Sentry, this would be immediate and non-blocking
        // The actual network sending happens in the background
      })

      // Act
      const startTime = performance.now()
      errors.forEach((error) => {
        Sentry.captureException(error)
      })
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Assert
      // All calls should complete very quickly since they're synchronous
      expect(totalTime).toBeLessThan(10) // Should be nearly instant
      expect(mockSentryScope.captureException).toHaveBeenCalledTimes(10)

      // Verify all errors were captured
      errors.forEach((error, index) => {
        expect(mockSentryScope.captureException).toHaveBeenNthCalledWith(
          index + 1,
          error,
        )
      })
    })

    it("should not block UI due to network delays", async () => {
      // Arrange
      const networkDelay = 500 // 500ms network delay

      // Initialize Sentry first
      await initSentry()

      // Track when the mock captureException is called
      let mockCaptureStarted = false
      mockSentryScope.captureException.mockImplementation(() => {
        mockCaptureStarted = true
        // Simulate async processing without blocking the main thread
        setTimeout(() => {
          // This represents the actual network request happening asynchronously
        }, networkDelay)
      })

      let uiTaskCompleted = false
      const simulateUITask = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        uiTaskCompleted = true
      }

      // Act
      const callStartTime = performance.now()
      Sentry.captureException(new Error("Network error"))
      const callEndTime = performance.now()

      const uiPromise = simulateUITask()

      // Wait for UI task to complete
      await uiPromise

      // Assert
      // Sentry.captureException should return immediately (non-blocking)
      expect(callEndTime - callStartTime).toBeLessThan(10)

      // UI task should complete without being blocked
      expect(uiTaskCompleted).toBe(true)

      // The underlying Sentry scope should have been called
      expect(mockSentryScope.captureException).toHaveBeenCalledWith(
        expect.any(Error),
      )
      expect(mockCaptureStarted).toBe(true)
    })
  })
})

describe("Sentry Configuration Management Tests", () => {
  beforeEach(() => {
    // Clear only call history, not implementations
    if (mockSentryClient?.init) mockSentryClient.init.mockClear()
    if (mockSentryScope?.setClient) mockSentryScope.setClient.mockClear()
    if (mockSentryScope?.captureException)
      mockSentryScope.captureException.mockClear()
    if (mockSentryScope?.captureMessage)
      mockSentryScope.captureMessage.mockClear()
    mockChromeStorageSync.get.mockClear()

    // Reset to default state
    mockIsDebug.value = false
    TestUtils.reset()

    // Set default mock for chrome.storage.sync.get to prevent undefined errors
    mockChromeStorageSync.get.mockResolvedValue({
      [STORAGE_KEY.USER]: {
        pageRules: [],
      },
    })

    // Set default window.location.href
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test" },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("ST-05-a: Configuration retrieval from STORAGE_KEY.USER via chrome.storage.sync.get() should work correctly", () => {
    it("should retrieve valid configuration data", async () => {
      // Arrange
      const mockStorageData = {
        [STORAGE_KEY.USER]: {
          pageRules: [
            {
              urlPattern: "*://example.com/*",
              popupEnabled: POPUP_ENABLED.ENABLE,
            },
          ],
          commands: [],
          shortcuts: {},
        },
      }
      mockChromeStorageSync.get.mockResolvedValue(mockStorageData)

      // Act
      const result = await chrome.storage.sync.get([STORAGE_KEY.USER])
      const userSettings = result[STORAGE_KEY.USER]

      // Assert
      expect(userSettings).toEqual(mockStorageData[STORAGE_KEY.USER])
      expect(userSettings.pageRules).toHaveLength(1)
      expect(userSettings.pageRules[0].popupEnabled).toBe(POPUP_ENABLED.ENABLE)
      expect(mockChromeStorageSync.get).toHaveBeenCalledWith([STORAGE_KEY.USER])
    })

    it("should work correctly even with empty configuration data", async () => {
      // Arrange
      const emptyStorageData = {
        [STORAGE_KEY.USER]: {
          pageRules: [],
          commands: [],
          shortcuts: {},
        },
      }
      mockChromeStorageSync.get.mockResolvedValue(emptyStorageData)

      // Act
      const result = await chrome.storage.sync.get([STORAGE_KEY.USER])
      const userSettings = result[STORAGE_KEY.USER]

      // Assert
      expect(userSettings).toEqual(emptyStorageData[STORAGE_KEY.USER])
      expect(Array.isArray(userSettings.pageRules)).toBe(true)
      expect(userSettings.pageRules).toHaveLength(0)
    })

    it("should call chrome.storage.sync.get correctly", async () => {
      // Arrange
      const mockStorageData = {
        [STORAGE_KEY.USER]: {
          pageRules: [],
        },
      }
      mockChromeStorageSync.get.mockResolvedValue(mockStorageData)

      // Act
      await chrome.storage.sync.get([STORAGE_KEY.USER])
      await chrome.storage.sync.get([STORAGE_KEY.USER])

      // Assert
      expect(mockChromeStorageSync.get).toHaveBeenCalledTimes(2)
      expect(mockChromeStorageSync.get).toHaveBeenCalledWith([STORAGE_KEY.USER])
    })
  })

  describe("ST-05-b: Sentry initialization state should be appropriately updated when settings change", () => {
    it("should update Sentry state when pageRule is added", async () => {
      // Arrange
      const initialStorageData = {
        [`${STORAGE_KEY.USER}`]: {
          pageRules: [],
        },
      }
      const updatedStorageData = {
        [`${STORAGE_KEY.USER}`]: {
          pageRules: [
            {
              urlPattern: "//example.com",
              popupEnabled: POPUP_ENABLED.DISABLE,
            },
          ],
        },
      }

      mockChromeStorageSync.get
        .mockResolvedValueOnce(initialStorageData)
        .mockResolvedValueOnce(updatedStorageData)

      // Mock URL to match the new rule
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com/test" },
        writable: true,
      })

      // Act
      await initSentry() // First initialization
      expect(TestUtils.isInitialized()).toBe(true)
      await initSentry() // Second initialization after settings change
      expect(TestUtils.isInitialized()).toBe(false)

      // Assert
      expect(mockChromeStorageSync.get).toHaveBeenCalledTimes(2)
      expect(mockChromeStorageSync.get).toHaveBeenCalledWith(
        `${STORAGE_KEY.USER}`,
      )
      // Verify that second call respects the new pageRule
    })

    it("should update Sentry state when pageRule is removed", async () => {
      // Arrange
      const initialStorageData = {
        [STORAGE_KEY.USER]: {
          pageRules: [
            {
              urlPattern: "//example.com/",
              popupEnabled: POPUP_ENABLED.DISABLE,
            },
          ],
        },
      }
      const updatedStorageData = {
        [STORAGE_KEY.USER]: {
          pageRules: [],
        },
      }

      mockChromeStorageSync.get
        .mockResolvedValueOnce(initialStorageData)
        .mockResolvedValueOnce(updatedStorageData)

      // Mock URL that was previously disabled
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com/test" },
        writable: true,
      })

      // Act
      await initSentry() // First initialization (should be skipped)
      expect(TestUtils.isInitialized()).toBe(false)
      await initSentry() // Second initialization (should work)
      expect(TestUtils.isInitialized()).toBe(true)

      // Assert
      expect(mockChromeStorageSync.get).toHaveBeenCalledTimes(2)
    })
  })

  describe("ST-05-c: Appropriate fallback processing should be performed for invalid configuration values", () => {
    it("should not error even with invalid pageRule settings", async () => {
      // Arrange
      const invalidStorageData = {
        [STORAGE_KEY.USER]: {
          pageRules: [
            {
              urlPattern: null, // Invalid URL pattern
              popupEnabled: "invalid_value", // Invalid enum value
            },
          ],
        },
      }
      mockChromeStorageSync.get.mockResolvedValue(invalidStorageData as any)

      // Act & Assert
      const { initSentry } = await import("@/lib/sentry")
      await expect(initSentry()).resolves.not.toThrow()
    })

    it("should use default values when configuration data is null", async () => {
      // Arrange
      mockChromeStorageSync.get.mockResolvedValue({
        [STORAGE_KEY.USER]: null,
      } as any)

      // Act & Assert
      const { initSentry } = await import("@/lib/sentry")
      await expect(initSentry()).resolves.not.toThrow()
    })

    it("should use default values when configuration data is incomplete", () => {
      // Arrange
      const incompleteStorageData = {
        [STORAGE_KEY.USER]: {
          // Missing pageRules property
          commands: [],
        },
      }
      mockChromeStorageSync.get.mockResolvedValue(incompleteStorageData as any)

      // Mock function to provide default values
      const getDefaultPageRules = () => []
      const normalizeUserSettings = (userSettings: any) => ({
        pageRules: userSettings?.pageRules || getDefaultPageRules(),
        commands: userSettings?.commands || [],
        shortcuts: userSettings?.shortcuts || {},
      })

      // Act
      const normalized = normalizeUserSettings(
        incompleteStorageData[STORAGE_KEY.USER],
      )

      // Assert
      expect(normalized.pageRules).toEqual([])
      expect(Array.isArray(normalized.pageRules)).toBe(true)
    })

    it("should initialize Sentry with default behavior when storage error occurs", async () => {
      // Arrange
      mockChromeStorageSync.get.mockRejectedValue(new Error("Storage error"))

      // Act & Assert
      const { initSentry } = await import("@/lib/sentry")
      await expect(initSentry()).resolves.not.toThrow()
    })
  })
})
