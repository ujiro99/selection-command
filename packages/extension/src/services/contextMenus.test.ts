import { describe, it, expect, vi, beforeEach } from "vitest"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { ContextMenu } from "./contextMenus"
import { OPEN_MODE, OPTION_FOLDER, ROOT_FOLDER } from "@/const"
import type { Command, CommandFolder } from "@/types"

// Mock dependencies
vi.mock("@/services/settings/enhancedSettings")
vi.mock("@/services/settings/settings")

const mockEnhancedSettings = vi.mocked(enhancedSettings)

// Mock Chrome APIs
const mockContextMenusCreate = vi.fn()
global.chrome = {
  contextMenus: {
    removeAll: vi.fn(),
    create: mockContextMenusCreate,
    onClicked: {
      removeListener: vi.fn(),
      addListener: vi.fn(),
    },
  },
} as any

describe("Service Layer Migration", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock
    mockEnhancedSettings.get.mockResolvedValue({
      commands: [],
      folders: [],
      pageRules: [],
      stars: [],
      shortcuts: { shortcuts: [] },
      commandExecutionCount: 0,
      hasShownReviewRequest: false,
      startupMethod: { method: "contextMenu", threshold: 1 },
    } as any)
  })

  it("MG-02-b: should use enhancedSettings.get() in contextMenus", async () => {
    // Mock chrome.contextMenus.removeAll to call the callback
    ;(chrome.contextMenus.removeAll as any).mockImplementation(async () => {
      return
    })

    // This test will fail initially because ContextMenu.init still uses Settings.get()
    await ContextMenu.init()

    expect(mockEnhancedSettings.get).toHaveBeenCalledTimes(1)
  })
})

// Test data helpers
const createCommand = (
  id: string,
  title: string,
  parentFolderId?: string,
): Command => ({
  id,
  title,
  openMode: OPEN_MODE.POPUP,
  searchUrl: "",
  iconUrl: "",
  parentFolderId: parentFolderId || ROOT_FOLDER,
})

const createFolder = (
  id: string,
  title: string,
  parentFolderId?: string,
): CommandFolder => ({
  id,
  title,
  parentFolderId: parentFolderId || ROOT_FOLDER,
})

describe("Context Menu Multi-level Hierarchy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    let mockIdCounter = 0
    mockContextMenusCreate.mockImplementation(
      (_options: any, callback?: () => void) => {
        const menuId = `mock-menu-id-${++mockIdCounter}`
        // Call callback immediately for testing
        if (callback) {
          callback()
        }
        return menuId
      },
    )

    // Clear commandIdObj between tests
    ContextMenu.commandIdObj = {}

    // Mock chrome.contextMenus.removeAll to call the callback
    ;(chrome.contextMenus.removeAll as any).mockImplementation(async () => {})

    // Mock chrome.runtime.lastError
    global.chrome.runtime = {
      lastError: null,
    } as any
  })

  describe("Basic functionality tests", () => {
    it("CM-01: should create 1-level folder structure correctly", async () => {
      const folders = [createFolder("folder1", "Folder 1")]
      const commands = [createCommand("cmd1", "Command 1", "folder1")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should create root menu + folder + command
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(3)

      // Check root menu creation
      expect(mockContextMenusCreate).toHaveBeenNthCalledWith(
        1,
        {
          id: "selection-command-root",
          title: "Selection Command",
          contexts: ["selection"],
        },
        expect.any(Function),
      )

      // Check folder creation
      expect(mockContextMenusCreate).toHaveBeenNthCalledWith(
        2,
        {
          title: "Folder 1",
          contexts: ["selection"],
          id: "folder1",
          parentId: "mock-menu-id-1",
        },
        expect.any(Function),
      )

      // Check command creation
      expect(mockContextMenusCreate).toHaveBeenNthCalledWith(
        3,
        {
          title: "Command 1",
          parentId: "mock-menu-id-2",
          contexts: ["selection"],
          id: "cmd1",
        },
        expect.any(Function),
      )
    })

    it("CM-02: should create 2-level folder structure correctly", async () => {
      const folders = [
        createFolder("folder1", "Folder 1"),
        createFolder("folder2", "Folder 2", "folder1"),
      ]
      const commands = [createCommand("cmd1", "Command 1", "folder2")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should create root menu + folder1 + folder2 + command
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(4)

      // Verify the nested structure is created correctly
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          id: "folder2",
          title: "Folder 2",
          contexts: ["selection"],
          parentId: "mock-menu-id-2", // Should be parent of folder1
        },
        expect.any(Function),
      )
    })

    it("CM-03: should create 3+ level deep structure correctly", async () => {
      const folders = [
        createFolder("folder1", "Folder 1"),
        createFolder("folder2", "Folder 2", "folder1"),
        createFolder("folder3", "Folder 3", "folder2"),
      ]
      const commands = [createCommand("cmd1", "Command 1", "folder3")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should create root menu + 3 folders + command
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(5)

      // Verify deep nesting
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          title: "Folder 3",
          contexts: ["selection"],
          id: "folder3",
          parentId: "mock-menu-id-3", // Should be parent of folder2
        },
        expect.any(Function),
      )
    })

    it("CM-04: should display empty folders correctly", async () => {
      const folders = [createFolder("empty-folder", "Empty Folder")]
      const commands: Command[] = []

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should create root menu + empty folder
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(2)

      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          title: "Empty Folder",
          contexts: ["selection"],
          id: "empty-folder",
          parentId: "mock-menu-id-1",
        },
        expect.any(Function),
      )
    })

    it("CM-05: should update menu when settings change", async () => {
      const mockRemoveAll = chrome.contextMenus.removeAll as any
      const mockRemoveListener = chrome.contextMenus.onClicked
        .removeListener as any
      const mockAddListener = chrome.contextMenus.onClicked.addListener as any

      // Initial settings
      const initialFolders = [createFolder("folder1", "Folder 1")]
      const initialCommands = [createCommand("cmd1", "Command 1", "folder1")]

      mockEnhancedSettings.get.mockResolvedValueOnce({
        commands: initialCommands,
        folders: initialFolders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should create initial menus
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(3)

      // Updated settings
      const updatedFolders = [createFolder("folder2", "Folder 2")]
      const updatedCommands = [createCommand("cmd2", "Command 2", "folder2")]

      mockEnhancedSettings.get.mockResolvedValueOnce({
        commands: updatedCommands,
        folders: updatedFolders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      // Clear mock calls for second init
      vi.clearAllMocks()
      let mockIdCounter = 0
      mockContextMenusCreate.mockImplementation(
        (_options: any, callback?: () => void) => {
          const menuId = `mock-menu-id-${++mockIdCounter}`
          // Simulate async behavior with callback
          if (callback) {
            setTimeout(() => callback(), 0)
          }
          return menuId
        },
      )

      await ContextMenu.init()

      // Should remove all previous menus and create new ones
      expect(mockRemoveAll).toHaveBeenCalledTimes(1)
      expect(mockRemoveListener).toHaveBeenCalledTimes(1)
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(3) // root + folder2 + cmd2
      expect(mockAddListener).toHaveBeenCalledTimes(1)

      // Check that new menu structure is created
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          title: "Folder 2",
          contexts: ["selection"],
          id: "folder2",
          parentId: "mock-menu-id-1",
        },
        expect.any(Function),
      )
    })
  })

  describe("Command processing tests", () => {
    it("CM-06: should create root-level commands correctly", async () => {
      const folders: CommandFolder[] = []
      const commands = [createCommand("root-cmd", "Root Command")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          title: "Root Command",
          parentId: "mock-menu-id-1", // Root menu ID
          contexts: ["selection"],
          id: "root-cmd",
        },
        expect.any(Function),
      )
    })

    it("CM-07: should create commands in 1-level folders correctly", async () => {
      const folders = [createFolder("folder1", "Folder 1")]
      const commands = [createCommand("cmd1", "Command 1", "folder1")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Command should be placed in the folder, not root
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          title: "Command 1",
          parentId: "mock-menu-id-2", // Folder's menu ID
          contexts: ["selection"],
          id: "cmd1",
        },
        expect.any(Function),
      )
    })

    it("CM-08: should create commands in deep hierarchy correctly", async () => {
      const folders = [
        createFolder("folder1", "Folder 1"),
        createFolder("folder2", "Folder 2", "folder1"),
        createFolder("folder3", "Folder 3", "folder2"),
      ]
      const commands = [createCommand("deep-cmd", "Deep Command", "folder3")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Command should be in the deepest folder
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          title: "Deep Command",
          parentId: "mock-menu-id-4", // folder3's menu ID
          contexts: ["selection"],
          id: "deep-cmd",
        },
        expect.any(Function),
      )
    })

    it("CM-09: should create mixed structure (folders + commands) correctly", async () => {
      const folders = [createFolder("folder1", "Folder 1")]
      const commands = [
        createCommand("root-cmd", "Root Command"),
        createCommand("folder-cmd", "Folder Command", "folder1"),
      ]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should create root + folder + 2 commands
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(4)
    })
  })

  describe("Special case tests", () => {
    it("CM-10: should display OPTION_FOLDER separator correctly", async () => {
      const folders = [createFolder(OPTION_FOLDER, "Option")]
      const commands = [
        createCommand("opt-cmd", "Option Command", OPTION_FOLDER),
      ]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should create separator before option folder
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          title: "Option",
          type: "separator",
          contexts: ["selection"],
          id: "OptionSeparator",
          parentId: "mock-menu-id-1",
        },
        expect.any(Function),
      )
    })

    it("CM-11: should handle circular reference folder structure", async () => {
      // Create circular reference: folder1 -> folder2 -> folder1
      const folders = [
        createFolder("folder1", "Folder 1", "folder2"),
        createFolder("folder2", "Folder 2", "folder1"),
      ]
      const commands = [createCommand("cmd1", "Command 1", "folder1")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should handle circular reference gracefully
      // Both folders should be created, but circular dependency should be resolved
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(5) // root + 2 folders (one duplicated due to circular ref) + 1 command

      // Verify that folders are created (exact parent structure may vary due to circular resolution)
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Folder 1",
          contexts: ["selection"],
          id: "folder1",
        }),
        expect.any(Function),
      )

      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Folder 2",
          contexts: ["selection"],
          id: "folder2",
        }),
        expect.any(Function),
      )

      // Command should be placed somewhere in the hierarchy
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Command 1",
          contexts: ["selection"],
          id: "cmd1",
        }),
        expect.any(Function),
      )
    })

    it("CM-12: should handle non-existent parent folder references", async () => {
      const folders: CommandFolder[] = []
      const commands = [
        createCommand("orphan-cmd", "Orphan Command", "non-existent"),
      ]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Orphan command should be placed under root
      expect(mockContextMenusCreate).toHaveBeenCalledWith(
        {
          title: "Orphan Command",
          parentId: "mock-menu-id-1", // Root menu ID
          contexts: ["selection"],
          id: "orphan-cmd",
        },
        expect.any(Function),
      )
    })

    it("CM-16: should be executed only the last call, if called multiple times", async () => {
      const folders = [createFolder("folder1", "Folder 1")]
      const commands = [createCommand("cmd1", "Command 1", "folder1")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      ContextMenu.init()
      await new Promise((resolve) => setTimeout(resolve, 1))
      ContextMenu.init()
      await new Promise((resolve) => setTimeout(resolve, 1))
      ContextMenu.init()
      await new Promise((resolve) => setTimeout(resolve, 1))
      await ContextMenu.init()

      expect(mockContextMenusCreate).toHaveBeenCalledTimes(3)
    })

    it("CM-17: should be resolved, if called multiple times", async () => {
      const folders = [createFolder("folder1", "Folder 1")]
      const commands = [createCommand("cmd1", "Command 1", "folder1")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await Promise.all([
        ContextMenu.init(),
        ContextMenu.init(),
        ContextMenu.init(),
        ContextMenu.init(),
      ])

      expect(mockContextMenusCreate).toHaveBeenCalledTimes(3)
    })
  })

  describe("Compatibility tests", () => {
    it("CM-13: should work with existing 1-level settings data", async () => {
      // This simulates the current implementation's data structure
      const folders = [createFolder("folder1", "Folder 1")]
      const commands = [createCommand("cmd1", "Command 1", "folder1")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Should work exactly like before
      expect(mockContextMenusCreate).toHaveBeenCalledTimes(3)
      expect(ContextMenu.commandIdObj["mock-menu-id-3"]).toEqual(commands[0])
    })

    it("CM-14: should maintain commandIdObj mapping correctly", async () => {
      const folders = [createFolder("folder1", "Folder 1")]
      const commands = [
        createCommand("cmd1", "Command 1", "folder1"),
        createCommand("cmd2", "Command 2"),
      ]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // All commands should be mapped correctly
      expect(Object.keys(ContextMenu.commandIdObj)).toHaveLength(2)
    })

    it("CM-15: should execute command when menu is clicked", async () => {
      // Mock chrome.tabs and chrome.runtime APIs
      const mockSendMessage = vi.fn().mockResolvedValue("success")
      global.chrome.tabs = {
        sendMessage: mockSendMessage,
      } as any
      global.chrome.runtime = {
        lastError: null,
      } as any

      const folders = [createFolder("folder1", "Folder 1")]
      const commands = [createCommand("cmd1", "Command 1", "folder1")]

      mockEnhancedSettings.get.mockResolvedValue({
        commands,
        folders,
        startupMethod: { method: "contextMenu", threshold: 1 },
      } as any)

      await ContextMenu.init()

      // Simulate menu click
      const mockInfo: chrome.contextMenus.OnClickData = {
        menuItemId: "mock-menu-id-3", // Command menu ID
        selectionText: "selected text",
      } as any

      const mockTab: chrome.tabs.Tab = {
        id: 123,
        url: "https://example.com",
      } as any

      await ContextMenu.onClicked(mockInfo, mockTab)

      // Should call chrome.tabs.sendMessage with correct parameters
      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          command: "executeAction",
          param: {
            command: commands[0],
          },
        }),
      )
    })
  })
})
