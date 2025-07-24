import { afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom"
import {
  CMD_PREFIX,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  KEY,
  CMD_KEY,
  CMD_LOCAL_KEY,
} from "@/services/storage/const"

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Types for storage mock
type MockMode = "basic" | "realistic" | "custom"

interface ChromeStorageMocks {
  local: {
    get: any
    set: any
    remove: any
    clear: any
  }
  sync: {
    get: any
    set: any
    remove: any
    clear: any
  }
  onChanged: {
    addListener: any
    removeListener: any
    hasListener: any
  }
}

// Storage Mock Factory
class StorageMockFactory {
  private syncStorage: Map<KEY, unknown>
  private localStorage: Map<KEY, unknown>

  constructor() {
    this.syncStorage = new Map()
    this.localStorage = new Map()
  }

  // Helper function to create storage get mock
  private createStorageGetMock(storageMap: Map<KEY, unknown>, delay = 0) {
    return vi.fn().mockImplementation((keys?: KEY | KEY[] | null) => {
      return new Promise((resolve) => {
        const result: Record<string, unknown> = {}

        if (!keys || keys === null) {
          // Get all items
          for (const [key, value] of storageMap.entries()) {
            result[key] = value
          }
        } else if (typeof keys === "string" || typeof keys === "number") {
          // Get single item
          if (storageMap.has(`${keys}`)) {
            result[`${keys}`] = storageMap.get(`${keys}`)
          }
        } else if (Array.isArray(keys)) {
          // Get multiple items
          for (const key of keys) {
            if (storageMap.has(key)) {
              result[key] = storageMap.get(key)
            }
          }
        }
        if (delay > 0) {
          setTimeout(() => {
            resolve(result)
          }, delay)
        } else {
          resolve(result)
        }
      })
    })
  }

  // Helper function to create storage set mock
  private createStorageSetMock(storageMap: Map<KEY, unknown>) {
    return vi
      .fn()
      .mockImplementation(
        (items: Record<KEY, unknown>, callback?: () => void) => {
          return new Promise((resolve) => {
            for (const [key, value] of Object.entries(items)) {
              storageMap.set(`${key}`, value)
            }
            resolve(undefined)
            if (callback) {
              callback()
            }
          })
        },
      )
  }

  // Helper function to create storage remove mock
  private createStorageRemoveMock(storageMap: Map<KEY, unknown>) {
    return vi
      .fn()
      .mockImplementation((keys: KEY | KEY[], callback?: () => void) => {
        return new Promise((resolve) => {
          if (Array.isArray(keys)) {
            keys.forEach((key) => storageMap.delete(key))
          } else {
            storageMap.delete(keys)
          }
          resolve(undefined)
          if (callback) {
            callback()
          }
        })
      })
  }

  // Helper function to create storage clear mock
  private createStorageClearMock(storageMap: Map<KEY, unknown>) {
    return vi.fn().mockImplementation((callback?: () => void) => {
      return new Promise((resolve) => {
        storageMap.clear()
        resolve(undefined)
        if (callback) {
          callback()
        }
      })
    })
  }

  // Create realistic mocks with Map-based storage simulation
  createRealisticMocks(): ChromeStorageMocks {
    return {
      local: {
        get: this.createStorageGetMock(this.localStorage),
        set: this.createStorageSetMock(this.localStorage),
        remove: this.createStorageRemoveMock(this.localStorage),
        clear: this.createStorageClearMock(this.localStorage),
      },
      sync: {
        get: this.createStorageGetMock(this.syncStorage, 5),
        set: this.createStorageSetMock(this.syncStorage),
        remove: this.createStorageRemoveMock(this.syncStorage),
        clear: this.createStorageClearMock(this.syncStorage),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(),
      },
    }
  }

  // Create basic mocks (lightweight vi.fn() mocks)
  createBasicMocks(): ChromeStorageMocks {
    return {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(),
      },
    }
  }

  // Clear storage state
  clear(): void {
    this.syncStorage.clear()
    this.localStorage.clear()
  }

  // Reset mocks and clear storage
  reset(): void {
    this.clear()
    vi.clearAllMocks()
  }

  // Get direct access to storage maps for advanced testing
  getStorageMaps() {
    return {
      sync: this.syncStorage,
      local: this.localStorage,
    }
  }

  // Set data directly in storage maps
  setStorageData(key: KEY, value: unknown): void {
    const map = this.detectStorageArea(key)
    map.set(`${key}`, value)
  }

  // Get data directly from storage maps
  getStorageData(key: KEY): unknown {
    const map = this.detectStorageArea(key)
    return map.get(`${key}`)
  }

  private isCmdKey(key: unknown): key is CMD_KEY {
    return (
      !!key && `${key}`.startsWith(CMD_PREFIX) && !`${key}`.includes("local-")
    )
  }

  private isCmdLocalKey(key: unknown): key is CMD_LOCAL_KEY {
    return (
      !!key && `${key}`.startsWith(CMD_PREFIX) && `${key}`.includes("local-")
    )
  }

  private detectStorageArea(key: KEY): Map<KEY, unknown> {
    if (Object.values(STORAGE_KEY).includes(key) || this.isCmdKey(key)) {
      return this.syncStorage
    }
    if (
      Object.values(LOCAL_STORAGE_KEY).includes(key as LOCAL_STORAGE_KEY) ||
      this.isCmdLocalKey(key)
    ) {
      return this.localStorage
    }
    throw new Error("Invalid Storage Key")
  }
}

// Global storage mock factory instance
const globalStorageMockFactory = new StorageMockFactory()

// Function to setup storage mocks
function setupStorageMocks(mode: MockMode = "basic"): StorageMockFactory {
  const factory = new StorageMockFactory()

  let storageMocks: ChromeStorageMocks

  switch (mode) {
    case "realistic":
      storageMocks = factory.createRealisticMocks()
      break
    case "basic":
    default:
      storageMocks = factory.createBasicMocks()
      break
  }

  // Update global chrome object
  if (global.chrome && global.chrome.storage) {
    Object.assign(global.chrome.storage, storageMocks)
  }

  return factory
}

// Default basic mocks for backward compatibility
const defaultStorageMocks = globalStorageMockFactory.createBasicMocks()

// Mock Chrome extension APIs
global.chrome = {
  storage: defaultStorageMocks,
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

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0)) as any
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))

// Export for use in tests
export { StorageMockFactory, setupStorageMocks, type MockMode }
