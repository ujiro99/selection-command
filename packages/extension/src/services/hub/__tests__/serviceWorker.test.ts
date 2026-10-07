import { describe, it, expect, vi, beforeEach, type MockInstance } from "vitest"
import {
  shareCommandToHub,
  editCommandToHub,
  initHubExternalListener,
  resetEditSession,
  handleAddCommand,
  handleDeleteCommand,
  handleEditCommand,
  handleRequestInstalledCommand,
  handleUpdateCommand,
  handleSetSession,
  handleClearSession,
  pushEditToHub,
} from "../serviceWorker"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import { Settings } from "@/services/settings/settings"
import { sendEvent, getOrCreateClientId } from "@/services/analytics"
import { Ipc, TabCommand } from "@/services/ipc"
import { calcContentHash } from "@/services/hub/commandContent"

vi.mock("@/services/storage", () => ({
  Storage: {
    getCommands: vi.fn(),
    setCommands: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    updateCommands: vi.fn(),
    addListener: vi.fn(),
  },
  LOCAL_STORAGE_KEY: {
    HUB_USER: "hubUser",
    HUB_SHARED_AT: "hubSharedAt",
    HUB_REGISTERED: "hubRegistered",
  },
}))

vi.mock("@/services/settings/settings", () => ({
  Settings: { addCommands: vi.fn(), updateCommandId: vi.fn() },
}))

vi.mock("@/services/analytics", () => ({
  ANALYTICS_EVENTS: {
    HUB_ADD_SEARCH: "hub_add_search",
    HUB_ADD_AIPROMPT: "hub_add_aiprompt",
    HUB_ADD_OTHER: "hub_add_other",
    COMMAND_REMOVE: "command_remove",
  },
  sendEvent: vi.fn(),
  getOrCreateClientId: vi.fn(),
  getHubAddEvent: vi.fn(() => "hub_add_other"),
}))

vi.mock("@/const", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/const")>()
  return {
    ...actual,
    NEW_HUB_URL: "https://hub.example.com",
    OPTION_PAGE_PATH: "src/options_page.html",
  }
})

const mockSetSession = vi.fn()
const mockSignOut = vi.fn()

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      setSession: mockSetSession,
      signOut: mockSignOut,
    },
  }),
}))

const HUB_ORIGIN = "https://hub.example.com"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MessageListener = (
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean

function getRegisteredListener(): MessageListener {
  initHubExternalListener()
  const calls = vi.mocked(chrome.runtime.onMessageExternal.addListener).mock
    .calls
  return calls[calls.length - 1][0] as MessageListener
}

const searchCommandJson = JSON.stringify({
  id: "cmd-1",
  title: "Search",
  searchUrl: "https://google.com?q=%s",
  iconUrl: "",
  openMode: "tab",
  openModeSecondary: "popup",
  spaceEncoding: "plus",
  sourceType: "hubCommunity",
  sourceId: "src-1",
})

const aiPromptCommandJson = JSON.stringify({
  id: "cmd-2",
  title: "AI Prompt",
  iconUrl: "",
  openMode: "aiPrompt",
  aiPromptOption: { serviceId: "chatgpt" },
  sourceType: "selfCreated",
  sourceId: "src-2",
})

const pageActionCommandJson = JSON.stringify({
  id: "cmd-3",
  title: "Page Action",
  iconUrl: "",
  openMode: "pageAction",
  pageActionOption: { steps: [] },
})

const invalidCommandJson = JSON.stringify({
  id: "cmd-4",
  title: "Link",
  openMode: "linkPopup",
})

beforeEach(() => {
  vi.clearAllMocks()
  resetEditSession()
  vi.mocked(Storage.updateCommands).mockResolvedValue(true)
  vi.mocked(Settings.addCommands).mockResolvedValue(true)
  vi.mocked(Settings.updateCommandId).mockResolvedValue(undefined)
  vi.mocked(Storage.setCommands).mockResolvedValue(true)
  vi.mocked(Storage.set).mockResolvedValue(true)
  vi.mocked(Storage.get).mockResolvedValue(true)
  vi.mocked(sendEvent).mockResolvedValue(undefined as any)
  vi.mocked(getOrCreateClientId).mockResolvedValue("client-id-123")
  ;(chrome.tabs as any).remove = vi.fn()
  ;(chrome.tabs as any).update = vi.fn()
  Object.defineProperty(global.chrome.runtime, "onConnectExternal", {
    value: { addListener: vi.fn(), removeListener: vi.fn() },
    writable: true,
    configurable: true,
  })
})

// ---------------------------------------------------------------------------
// initHubExternalListener
// ---------------------------------------------------------------------------

describe("initHubExternalListener", () => {
  it("INIT-01: registers a listener on onMessageExternal", () => {
    initHubExternalListener()
    expect(chrome.runtime.onMessageExternal.addListener).toHaveBeenCalledTimes(
      1,
    )
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — origin validation
// ---------------------------------------------------------------------------

describe("onMessageExternal - origin validation", () => {
  it("ORIGIN-01: processes message when origin matches hub", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([])
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "RequestInstalledCommand" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
  })

  it("ORIGIN-02: returns false when origin does not match hub", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "AddCommand", command: searchCommandJson },
      { origin: "https://evil.example.com" },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })

  it("ORIGIN-03: returns false when sender.origin is undefined", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "AddCommand", command: searchCommandJson },
      {},
      sendResponse,
    )
    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// handleAddCommand (unit)
// ---------------------------------------------------------------------------

describe("handleAddCommand", () => {
  it("AC-01: adds a search command and responds with install_id", async () => {
    const sendResponse = vi.fn()
    await handleAddCommand(searchCommandJson, sendResponse)

    expect(Settings.addCommands).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "cmd-1",
        title: "Search",
        searchUrl: "https://google.com?q=%s",
        openMode: "tab",
        sourceType: "hubCommunity",
        sourceId: "src-1",
      }),
    ])
    expect(sendEvent).toHaveBeenCalled()
    expect(getOrCreateClientId).toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      result: true,
      install_id: "client-id-123",
    })
  })

  it("AC-02: adds an AI prompt command", async () => {
    const sendResponse = vi.fn()
    await handleAddCommand(aiPromptCommandJson, sendResponse)

    expect(Settings.addCommands).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "cmd-2",
        openMode: "aiPrompt",
        aiPromptOption: { serviceId: "chatgpt" },
        sourceType: "selfCreated",
        sourceId: "src-2",
      }),
    ])
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ result: true }),
    )
  })

  it("AC-03: adds a page action command", async () => {
    const sendResponse = vi.fn()
    await handleAddCommand(pageActionCommandJson, sendResponse)

    expect(Settings.addCommands).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "cmd-3",
        openMode: "pageAction",
        pageActionOption: { steps: [] },
      }),
    ])
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ result: true }),
    )
  })

  it("AC-04: responds with error when command type is unrecognized", async () => {
    const sendResponse = vi.fn()
    await handleAddCommand(invalidCommandJson, sendResponse)

    expect(Settings.addCommands).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "Invalid command format",
    })
  })

  it("AC-05: responds with error on invalid JSON", async () => {
    const sendResponse = vi.fn()
    await handleAddCommand("not-valid-json", sendResponse)

    expect(Settings.addCommands).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ result: false }),
    )
  })

  it("AC-06: responds with error when Settings.addCommands rejects", async () => {
    vi.mocked(Settings.addCommands).mockRejectedValue(new Error("save failed"))
    const sendResponse = vi.fn()
    await handleAddCommand(searchCommandJson, sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "save failed",
    })
  })

  it("AC-08: stores contentUpdatedAt and the content fingerprint", async () => {
    const cmd = JSON.stringify({
      ...JSON.parse(searchCommandJson),
      contentUpdatedAt: "2026-01-02T03:04:05.000Z",
    })
    const sendResponse = vi.fn()
    await handleAddCommand(cmd, sendResponse)

    const saved = vi.mocked(Settings.addCommands).mock.calls[0][0][0]
    expect(saved.contentUpdatedAt).toBe("2026-01-02T03:04:05.000Z")
    expect(saved.contentHash).toBe(calcContentHash(saved))
  })

  it("AC-09: ignores an unparsable contentUpdatedAt", async () => {
    const cmd = JSON.stringify({
      ...JSON.parse(searchCommandJson),
      contentUpdatedAt: "not-a-date",
    })
    await handleAddCommand(cmd, vi.fn())

    const saved = vi.mocked(Settings.addCommands).mock.calls[0][0][0]
    expect(saved.contentUpdatedAt).toBeUndefined()
  })

  it("AC-10: responds with error when the JSON is not an object", async () => {
    for (const json of ["null", "123", '"text"', "[]"]) {
      const sendResponse = vi.fn()
      await handleAddCommand(json, sendResponse)
      expect(sendResponse).toHaveBeenCalledWith({
        result: false,
        error: "Invalid command format",
      })
    }
    expect(Settings.addCommands).not.toHaveBeenCalled()
  })

  it("AC-07: normalizes unknown sourceType to undefined", async () => {
    const cmd = JSON.stringify({
      id: "cmd-x",
      title: "X",
      searchUrl: "https://x.com?q=%s",
      iconUrl: "",
      openMode: "tab",
      sourceType: "unknownType",
    })
    const sendResponse = vi.fn()
    await handleAddCommand(cmd, sendResponse)

    expect(Settings.addCommands).toHaveBeenCalledWith([
      expect.objectContaining({ sourceType: undefined }),
    ])
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — AddCommand (routing)
// ---------------------------------------------------------------------------

describe("onMessageExternal - AddCommand routing", () => {
  it("AC-R-01: routes to handleAddCommand and returns true", async () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "AddCommand", command: searchCommandJson },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ result: true }),
      ),
    )
  })

  it("AC-R-02: returns false when command is not a string", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "AddCommand", command: 42 },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(Settings.addCommands).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// handleDeleteCommand (unit)
// ---------------------------------------------------------------------------

describe("handleUpdateCommand", () => {
  const hubSender = {
    origin: HUB_ORIGIN,
    tab: { id: 10 } as chrome.tabs.Tab,
  } as chrome.runtime.MessageSender

  const incoming = {
    id: "cmd-1",
    title: "Search v2",
    searchUrl: "https://google.com/v2?q=%s",
    iconUrl: "https://icon/v2.png",
    openMode: "tab",
    openModeSecondary: "popup",
    spaceEncoding: "plus",
    contentUpdatedAt: "2026-02-01T00:00:00.000Z",
    sourceType: "hubCommunity",
    sourceId: "src-1",
  }

  // An installed command whose fingerprint matches its content (not edited).
  const installedBase = {
    id: "cmd-1",
    title: "Search",
    searchUrl: "https://google.com?q=%s",
    iconUrl: "https://icon/v1.png",
    openMode: "tab",
    openModeSecondary: "popup",
    spaceEncoding: "plus",
    contentUpdatedAt: "2026-01-01T00:00:00.000Z",
    sourceType: "hubCommunity",
    sourceId: "src-1",
    parentFolderId: "folder-1",
    popupOption: { width: 300, height: 400 },
    excludeFromGlobalIconColor: true,
  }
  const installed = {
    ...installedBase,
    contentHash: calcContentHash(installedBase),
  }

  let sendTabSpy: MockInstance<typeof Ipc.sendTab>
  beforeEach(() => {
    sendTabSpy = vi.spyOn(Ipc, "sendTab").mockResolvedValue(true)
  })

  it("UC-01: replaces content and keeps local settings when not edited", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([installed] as any)
    const sendResponse = vi.fn()
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, sendResponse)

    expect(sendTabSpy).not.toHaveBeenCalled()
    const updated = vi.mocked(Storage.updateCommands).mock.calls[0][0][0]
    expect(updated).toMatchObject({
      id: "cmd-1",
      title: "Search v2",
      searchUrl: "https://google.com/v2?q=%s",
      iconUrl: "https://icon/v2.png",
      contentUpdatedAt: "2026-02-01T00:00:00.000Z",
      parentFolderId: "folder-1",
      popupOption: { width: 300, height: 400 },
      excludeFromGlobalIconColor: true,
    })
    expect(updated.contentHash).toBe(calcContentHash(updated))
    expect(sendResponse).toHaveBeenCalledWith({ result: true })
  })

  it("UC-02: asks for confirmation when edited locally, then overwrites", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { ...installed, title: "My edit" },
    ] as any)
    const sendResponse = vi.fn()
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, sendResponse)

    expect(sendTabSpy).toHaveBeenCalledWith(
      10,
      TabCommand.confirmCommandUpdate,
      { title: "My edit" },
    )
    expect(Storage.updateCommands).toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({ result: true })
  })

  it("UC-02b: resets selfUpdated source info to the Hub's on overwrite", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([
      {
        ...installed,
        title: "My edit",
        sourceType: "selfUpdated",
        sourceId: "self-updated-id",
      },
    ] as any)
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, vi.fn())

    const updated = vi.mocked(Storage.updateCommands).mock.calls[0][0][0]
    expect(updated.sourceType).toBe("hubCommunity")
    expect(updated.sourceId).toBe("src-1")
  })

  it("UC-02c: applies the update to the command as reloaded after the dialog", async () => {
    const edited = { ...installed, title: "My edit" }
    // The folder is changed in the options page while the dialog is open.
    vi.mocked(Storage.getCommands)
      .mockResolvedValueOnce([edited] as any)
      .mockResolvedValueOnce([{ ...edited, parentFolderId: "folder-2" }] as any)
    const sendResponse = vi.fn()
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, sendResponse)

    const updated = vi.mocked(Storage.updateCommands).mock.calls[0][0][0]
    expect(updated.parentFolderId).toBe("folder-2")
    expect(updated.title).toBe("Search v2")
    expect(sendResponse).toHaveBeenCalledWith({ result: true })
  })

  it("UC-02d: fails when the command is removed while the dialog is open", async () => {
    const edited = { ...installed, title: "My edit" }
    vi.mocked(Storage.getCommands)
      .mockResolvedValueOnce([edited] as any)
      .mockResolvedValueOnce([] as any)
    const sendResponse = vi.fn()
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, sendResponse)

    expect(Storage.updateCommands).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "Command not found",
    })
  })

  it("UC-02e: fails without asking when edited locally and the sender has no tab", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { ...installed, title: "My edit" },
    ] as any)
    const sendResponse = vi.fn()
    await handleUpdateCommand(
      JSON.stringify(incoming),
      { origin: HUB_ORIGIN } as chrome.runtime.MessageSender,
      sendResponse,
    )

    expect(sendTabSpy).not.toHaveBeenCalled()
    expect(Storage.updateCommands).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "Invalid sender tab",
    })
  })

  it("UC-03: treats a command without fingerprint as edited", async () => {
    const { contentHash: _hash, ...noHash } = installed
    vi.mocked(Storage.getCommands).mockResolvedValue([noHash] as any)
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, vi.fn())

    expect(sendTabSpy).toHaveBeenCalled()
  })

  it("UC-04: responds cancelled and keeps the command when the user cancels", async () => {
    sendTabSpy.mockResolvedValue(false)
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { ...installed, title: "My edit" },
    ] as any)
    const sendResponse = vi.fn()
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, sendResponse)

    expect(Storage.updateCommands).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      cancelled: true,
    })
  })

  it("UC-05: fails without overwriting when the dialog cannot be shown", async () => {
    sendTabSpy.mockResolvedValue(undefined)
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { ...installed, title: "My edit" },
    ] as any)
    const sendResponse = vi.fn()
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, sendResponse)

    expect(Storage.updateCommands).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: expect.any(String),
    })
  })

  it("UC-06: responds with error when the command is not installed", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([] as any)
    const sendResponse = vi.fn()
    await handleUpdateCommand(JSON.stringify(incoming), hubSender, sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "Command not found",
    })
  })

  it("UC-07: responds with error for an unsupported command type", async () => {
    const sendResponse = vi.fn()
    await handleUpdateCommand(invalidCommandJson, hubSender, sendResponse)

    expect(Storage.updateCommands).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "Invalid command format",
    })
  })

  it("UC-08: drops fields of the old type when the type changes", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([installed] as any)
    const toAiPrompt = {
      id: "cmd-1",
      title: "Now AI",
      iconUrl: "",
      openMode: "aiPrompt",
      aiPromptOption: { serviceId: "chatgpt", prompt: "p", openMode: "tab" },
    }
    await handleUpdateCommand(JSON.stringify(toAiPrompt), hubSender, vi.fn())

    const updated = vi.mocked(Storage.updateCommands).mock.calls[0][0][0]
    expect(updated.openMode).toBe("aiPrompt")
    expect(updated).not.toHaveProperty("searchUrl")
    expect(updated).not.toHaveProperty("spaceEncoding")
    expect(updated.parentFolderId).toBe("folder-1")
  })

  it("UC-R-01: routes UpdateCommand and returns true", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([installed] as any)
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "UpdateCommand", command: JSON.stringify(incoming) },
      hubSender,
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ result: true }),
    )
  })
})

describe("handleDeleteCommand", () => {
  const mockCommands = [
    { id: "cmd-1", title: "Search", openMode: "tab" },
    { id: "cmd-2", title: "AI", openMode: "aiPrompt" },
  ] as any[]

  it("DC-01: removes the command and responds with result:true", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue(mockCommands)
    const sendResponse = vi.fn()
    await handleDeleteCommand("cmd-1", sendResponse)

    expect(Storage.setCommands).toHaveBeenCalledWith([mockCommands[1]])
    expect(sendEvent).toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({ result: true })
  })

  it("DC-02: responds with error when command is not found", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue(mockCommands)
    const sendResponse = vi.fn()
    await handleDeleteCommand("nonexistent-id", sendResponse)

    expect(Storage.setCommands).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "Command not found",
    })
  })

  it("DC-03: responds with error when Storage.getCommands rejects", async () => {
    vi.mocked(Storage.getCommands).mockRejectedValue(new Error("storage error"))
    const sendResponse = vi.fn()
    await handleDeleteCommand("cmd-1", sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "storage error",
    })
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — DeleteCommand (routing)
// ---------------------------------------------------------------------------

describe("onMessageExternal - DeleteCommand routing", () => {
  it("DC-R-01: routes to handleDeleteCommand and returns true", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { id: "cmd-1", title: "Search", openMode: "tab" } as any,
    ])
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "DeleteCommand", id: "cmd-1" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ result: true }),
    )
  })

  it("DC-R-02: returns false when id is not a string", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "DeleteCommand", id: 999 },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(Storage.getCommands).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// handleEditCommand (unit)
// ---------------------------------------------------------------------------

describe("handleEditCommand", () => {
  it("EC-01: returns false and error response when sender has no tab id", () => {
    const sendResponse = vi.fn()
    const result = handleEditCommand("cmd-1", {}, sendResponse)
    expect(result).toBe(false)
    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "Invalid sender tab",
    })
  })

  it("EC-02: creates options tab with correct URL and responds with result:true", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const sendResponse = vi.fn()
    const result = handleEditCommand(
      "cmd-123",
      { tab: { id: 10 } as chrome.tabs.Tab },
      sendResponse,
    )
    expect(result).toBe(true)
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      {
        url: expect.stringContaining(
          "src/options_page.html?editCommand=cmd-123&syncHub=1#commands",
        ),
      },
      expect.any(Function),
    )
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ result: true }),
    )
  })

  it("EC-03: responds with error when tab creation returns no id", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({} as chrome.tabs.Tab)
      return Promise.resolve({} as chrome.tabs.Tab)
    })
    const sendResponse = vi.fn()
    handleEditCommand(
      "cmd-1",
      { tab: { id: 10 } as chrome.tabs.Tab },
      sendResponse,
    )
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        result: false,
        error: "Failed to create edit tab",
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — EditCommand (routing)
// ---------------------------------------------------------------------------

describe("onMessageExternal - EditCommand routing", () => {
  it("EC-R-01: opens options page with editCommand and syncHub params", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "EditCommand", id: "cmd-123" },
      { origin: HUB_ORIGIN, tab: { id: 10 } as chrome.tabs.Tab },
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ result: true }),
    )
  })

  it("EC-R-02: returns false when id is not a string", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "EditCommand", id: 123 },
      { origin: HUB_ORIGIN, tab: { id: 10 } as chrome.tabs.Tab },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(chrome.tabs.create).not.toHaveBeenCalled()
  })

  it("EC-R-03: ignores hub-edit port when sender tab id does not match", () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const listener = getRegisteredListener()
    listener(
      { action: "EditCommand", id: "cmd-123" },
      { origin: HUB_ORIGIN, tab: { id: 10 } as chrome.tabs.Tab },
      vi.fn(),
    )
    const hubEditConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    const mockPort = {
      name: "hub-edit",
      sender: { tab: { id: 999 }, origin: HUB_ORIGIN },
      onDisconnect: { addListener: vi.fn() },
    }
    hubEditConnectListener(mockPort as any)
    expect(
      chrome.runtime.onConnectExternal.removeListener,
    ).not.toHaveBeenCalled()
    expect(mockPort.onDisconnect.addListener).not.toHaveBeenCalled()
  })

  it("EC-R-04: ignores hub-edit port from wrong origin", () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const listener = getRegisteredListener()
    listener(
      { action: "EditCommand", id: "cmd-123" },
      { origin: HUB_ORIGIN, tab: { id: 10 } as chrome.tabs.Tab },
      vi.fn(),
    )
    const hubEditConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    const mockPort = {
      name: "hub-edit",
      sender: { tab: { id: 10 }, origin: "https://evil.example.com" },
      onDisconnect: { addListener: vi.fn() },
    }
    hubEditConnectListener(mockPort as any)
    expect(
      chrome.runtime.onConnectExternal.removeListener,
    ).not.toHaveBeenCalled()
  })

  it("EC-R-05: hub-edit connect listener times out after EDIT_CONNECT_TIMEOUT_MS", () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const listener = getRegisteredListener()
    listener(
      { action: "EditCommand", id: "cmd-123" },
      { origin: HUB_ORIGIN, tab: { id: 10 } as chrome.tabs.Tab },
      vi.fn(),
    )
    vi.advanceTimersByTime(10_001)
    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()
    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// editCommandToHub
// ---------------------------------------------------------------------------

describe("editCommandToHub", () => {
  const sender = {} as any
  const editParam = {
    id: "cmd-1",
    title: "Updated",
    openMode: "tab",
    locale: "en",
    targetUrl: "https://example.com",
  } as any

  function setupConnectedHubEditPort() {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 77 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 77 } as chrome.tabs.Tab)
    })
    const listener = getRegisteredListener()
    listener(
      { action: "EditCommand", id: "cmd-1" },
      { origin: HUB_ORIGIN, tab: { id: 10 } as chrome.tabs.Tab },
      vi.fn(),
    )
    const hubEditConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    const port = {
      name: "hub-edit",
      sender: { tab: { id: 10 }, origin: HUB_ORIGIN },
      postMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      onDisconnect: { addListener: vi.fn() },
    }
    hubEditConnectListener(port as any)
    return port
  }

  it("EH-01: returns response(false) when no hub-edit port is available", () => {
    const response = vi.fn()
    const result = editCommandToHub(editParam, sender, response)
    expect(result).toBe(true)
    expect(response).toHaveBeenCalledWith(false)
  })

  it("EH-02: on ack, updates storage excluding locale/targetUrl", async () => {
    const port = setupConnectedHubEditPort()
    let onAckMessage: ((msg: unknown) => void) | undefined
    vi.mocked(port.onMessage.addListener).mockImplementation((fn) => {
      onAckMessage = fn
    })
    const response = vi.fn()

    editCommandToHub(editParam, sender, response)

    expect(port.postMessage).toHaveBeenCalledWith({
      type: "edit-command",
      command: { ...editParam, contentUpdatedAt: expect.any(String) },
    })
    const sent = vi.mocked(port.postMessage).mock.calls[0][0].command

    onAckMessage?.({ type: "edit-command-ack" })

    // The same contentUpdatedAt sent to the Hub is stored locally.
    expect(Storage.updateCommands).toHaveBeenCalledWith([
      {
        id: "cmd-1",
        title: "Updated",
        openMode: "tab",
        contentUpdatedAt: sent.contentUpdatedAt,
        contentHash: expect.any(String),
      },
    ])
    expect(port.onMessage.removeListener).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(response).toHaveBeenCalledWith(true)
      expect(chrome.tabs.remove).toHaveBeenCalledWith(77)
      expect(chrome.tabs.update).toHaveBeenCalledWith(10, { active: true })
    })
  })

  it("EH-03: responds with false when ack timeout passes", () => {
    vi.useFakeTimers()
    const port = setupConnectedHubEditPort()
    const response = vi.fn()

    editCommandToHub(editParam, sender, response)
    vi.advanceTimersByTime(10_001)

    expect(port.onMessage.removeListener).toHaveBeenCalled()
    expect(response).toHaveBeenCalledWith(false)
    vi.useRealTimers()
  })

  it("EH-04: rejects duplicate request while previous ack is pending", () => {
    vi.useFakeTimers()
    setupConnectedHubEditPort()
    const firstResponse = vi.fn()
    const secondResponse = vi.fn()

    editCommandToHub(editParam, sender, firstResponse)
    editCommandToHub(editParam, sender, secondResponse)

    expect(secondResponse).toHaveBeenCalledWith(false)
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// handleRequestInstalledCommand (unit)
// ---------------------------------------------------------------------------

describe("handleRequestInstalledCommand", () => {
  it("RI-01: responds with installed command IDs", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { id: "a" },
      { id: "b" },
    ] as any)
    const sendResponse = vi.fn()
    await handleRequestInstalledCommand(sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      action: "SyncInstalledCommand",
      installedIds: ["a", "b"],
      installedCommands: [{ id: "a" }, { id: "b" }],
    })
  })

  it("RI-03: includes contentUpdatedAt only for commands that have it", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { id: "a", contentUpdatedAt: "2026-01-01T00:00:00.000Z" },
      { id: "b" },
    ] as any)
    const sendResponse = vi.fn()
    await handleRequestInstalledCommand(sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      action: "SyncInstalledCommand",
      installedIds: ["a", "b"],
      installedCommands: [
        { id: "a", contentUpdatedAt: "2026-01-01T00:00:00.000Z" },
        { id: "b" },
      ],
    })
  })

  it("RI-02: responds with empty installedIds when getCommands rejects", async () => {
    vi.mocked(Storage.getCommands).mockRejectedValue(new Error("storage error"))
    const sendResponse = vi.fn()
    await handleRequestInstalledCommand(sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      action: "SyncInstalledCommand",
      installedIds: [],
      installedCommands: [],
    })
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — RequestInstalledCommand (routing)
// ---------------------------------------------------------------------------

describe("onMessageExternal - RequestInstalledCommand routing", () => {
  it("RI-R-01: returns installed command IDs via sendResponse", async () => {
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { id: "a" },
      { id: "b" },
    ] as any)
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "RequestInstalledCommand" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        action: "SyncInstalledCommand",
        installedIds: ["a", "b"],
        installedCommands: [{ id: "a" }, { id: "b" }],
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// handleSetSession (unit)
// ---------------------------------------------------------------------------

describe("handleSetSession", () => {
  it("SS-01: sets session, stores HubUser, and responds with result:true", async () => {
    mockSetSession.mockResolvedValue({
      data: { user: { id: "user-id-123", email: "user@example.com" } },
      error: null,
    })
    const sendResponse = vi.fn()
    await handleSetSession("access-tok", "refresh-tok", sendResponse)

    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: "access-tok",
      refresh_token: "refresh-tok",
    })
    expect(Storage.set).toHaveBeenCalledWith(LOCAL_STORAGE_KEY.HUB_USER, {
      id: "user-id-123",
      name: "user@example.com",
      image: "",
    })
    expect(sendResponse).toHaveBeenCalledWith({ result: true })
  })

  it("SS-02: responds with error when setSession returns supabase error", async () => {
    mockSetSession.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid token" },
    })
    const sendResponse = vi.fn()
    await handleSetSession("bad-tok", "bad-ref", sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "invalid token",
    })
    expect(Storage.set).not.toHaveBeenCalled()
  })

  it("SS-03: responds with error when data.user is null", async () => {
    mockSetSession.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    const sendResponse = vi.fn()
    await handleSetSession("tok", "ref", sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "Unknown error",
    })
  })

  it("SS-04: responds with error when setSession throws", async () => {
    mockSetSession.mockRejectedValue(new Error("network error"))
    const sendResponse = vi.fn()
    await handleSetSession("tok", "ref", sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "network error",
    })
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — SetSession (routing)
// ---------------------------------------------------------------------------

describe("onMessageExternal - SetSession routing", () => {
  it("SS-R-01: routes to handleSetSession and responds with result:true", async () => {
    mockSetSession.mockResolvedValue({
      data: { user: { email: "user@example.com" } },
      error: null,
    })
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      {
        action: "SetSession",
        access_token: "access-tok",
        refresh_token: "refresh-tok",
      },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ result: true }),
    )
  })

  it("SS-R-02: returns false when access_token is not a string", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "SetSession", access_token: 123, refresh_token: "ref" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(mockSetSession).not.toHaveBeenCalled()
  })

  it("SS-R-03: returns false when tokens are not provided", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "SetSession" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(mockSetSession).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// handleClearSession (unit)
// ---------------------------------------------------------------------------

describe("handleClearSession", () => {
  it("CS-01: signs out, clears HUB_USER, and responds with result:true", async () => {
    mockSignOut.mockResolvedValue({ error: null })
    const sendResponse = vi.fn()
    await handleClearSession(sendResponse)

    expect(mockSignOut).toHaveBeenCalled()
    expect(Storage.set).toHaveBeenCalledWith(LOCAL_STORAGE_KEY.HUB_USER, null)
    expect(sendResponse).toHaveBeenCalledWith({ result: true })
  })

  it("CS-02: responds with error when signOut throws", async () => {
    mockSignOut.mockRejectedValue(new Error("signout error"))
    const sendResponse = vi.fn()
    await handleClearSession(sendResponse)

    expect(sendResponse).toHaveBeenCalledWith({
      result: false,
      error: "signout error",
    })
    expect(Storage.set).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — ClearSession (routing)
// ---------------------------------------------------------------------------

describe("onMessageExternal - ClearSession routing", () => {
  it("CS-R-01: routes to handleClearSession and responds with result:true", async () => {
    mockSignOut.mockResolvedValue({ error: null })
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "ClearSession" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(Storage.set).toHaveBeenCalledWith(LOCAL_STORAGE_KEY.HUB_USER, null)
      expect(sendResponse).toHaveBeenCalledWith({ result: true })
    })
  })
})

// ---------------------------------------------------------------------------
// shareCommandToHub
// ---------------------------------------------------------------------------

describe("shareCommandToHub", () => {
  const param = { locale: "en", id: "cmd-1" } as any
  const sender = {} as any

  it("SH-01: returns true immediately (async response marker)", () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 1 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 1 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    const result = shareCommandToHub(param, sender, response)
    expect(result).toBe(true)
  })

  it("SH-02: opens hub tab and calls response(true)", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(true))
    expect(chrome.runtime.onConnectExternal.addListener).toHaveBeenCalledTimes(
      1,
    )
  })

  it("SH-02b: opens the sign-up page instead of the dashboard, and skips the port handshake, when the user has never registered", async () => {
    vi.mocked(Storage.get).mockResolvedValue(false)
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(true))

    expect(chrome.tabs.create).toHaveBeenCalledWith(
      { url: `${HUB_ORIGIN}/auth/signup` },
      expect.any(Function),
    )
    expect(chrome.runtime.onConnectExternal.addListener).not.toHaveBeenCalled()
  })

  it("SH-03: calls response(false) when tab.id is undefined", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({} as chrome.tabs.Tab)
      return Promise.resolve({} as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(false))
  })

  it("SH-04: calls response(false) when chrome.tabs.create throws", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation(() => {
      throw new Error("tabs.create error")
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(false))
    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()
  })

  it("SH-05: ignores port with wrong name", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

    // Two ticks: one for the HUB_REGISTERED check (via isHubRegistered's own
    // await), one for the tab-creation await that assigns tabId before the
    // port-connect handler can match it.
    await Promise.resolve()
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    const mockPort = {
      name: "wrong-name",
      sender: { tab: { id: 42 } },
      postMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    }
    portConnectListener(mockPort as any)

    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(true))
    expect(mockPort.postMessage).not.toHaveBeenCalled()
  })

  it("SH-06: ignores port from a different tab", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

    // Two ticks: one for the HUB_REGISTERED check (via isHubRegistered's own
    // await), one for the tab-creation await that assigns tabId before the
    // port-connect handler can match it.
    await Promise.resolve()
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    const mockPort = {
      name: "hub-share",
      sender: { tab: { id: 99 } },
      postMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    }
    portConnectListener(mockPort as any)

    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(true))
    expect(mockPort.postMessage).not.toHaveBeenCalled()
  })

  it("SH-07: valid port sends share-command; ack stops timer but keeps listener", async () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

    // Three ticks: two for the HUB_REGISTERED check (isHubRegistered's own
    // await plus the async-function-return microtask), one for the
    // tab-creation await that assigns tabId before the port-connect handler
    // can match it.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]

    let capturedOnMessage: ((msg: unknown) => void) | undefined
    const mockPort = {
      name: "hub-share",
      sender: { tab: { id: 42 } },
      postMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn((fn) => {
          capturedOnMessage = fn
        }),
        removeListener: vi.fn(),
      },
    }
    portConnectListener(mockPort as any)

    vi.advanceTimersByTime(500)

    expect(mockPort.postMessage).toHaveBeenCalledWith({
      type: "share-command",
      command: { ...param, contentUpdatedAt: expect.any(String) },
    })
    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()

    // ack stops the retry timer but keeps the message listener alive
    capturedOnMessage?.({ type: "share-command-ack" })
    expect(mockPort.onMessage.removeListener).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("SH-08: share-command-submitted updates HUB_SHARED_AT and removes listener", async () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

    // Three ticks: two for the HUB_REGISTERED check (isHubRegistered's own
    // await plus the async-function-return microtask), one for the
    // tab-creation await that assigns tabId before the port-connect handler
    // can match it.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]

    let capturedOnMessage: ((msg: unknown) => void) | undefined
    const mockPort = {
      name: "hub-share",
      sender: { tab: { id: 42 } },
      postMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn((fn) => {
          capturedOnMessage = fn
        }),
        removeListener: vi.fn(),
      },
    }
    portConnectListener(mockPort as any)

    vi.advanceTimersByTime(100)

    capturedOnMessage?.({ type: "share-command-ack" })
    expect(mockPort.onMessage.removeListener).not.toHaveBeenCalled()
    expect(Storage.set).not.toHaveBeenCalledWith(
      LOCAL_STORAGE_KEY.HUB_SHARED_AT,
      expect.any(Number),
    )

    capturedOnMessage?.({ type: "share-command-submitted", commandId: "cmd-1" })
    expect(mockPort.onMessage.removeListener).toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(Storage.set).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY.HUB_SHARED_AT,
        expect.any(Number),
      ),
    )

    vi.useRealTimers()
  })

  it("SH-08b: share-command-submitted saves the sent contentUpdatedAt locally", async () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    vi.mocked(Storage.getCommands).mockResolvedValue([
      { id: "cmd-1", title: "Local" },
    ] as any)
    shareCommandToHub(param, sender, vi.fn())
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    let capturedOnMessage: ((msg: unknown) => void) | undefined
    const mockPort = {
      name: "hub-share",
      sender: { tab: { id: 42 } },
      postMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn((fn) => {
          capturedOnMessage = fn
        }),
        removeListener: vi.fn(),
      },
    }
    portConnectListener(mockPort as any)
    vi.advanceTimersByTime(200)
    const sent = vi.mocked(mockPort.postMessage).mock.calls[0][0].command

    capturedOnMessage?.({ type: "share-command-ack" })
    expect(Storage.updateCommands).not.toHaveBeenCalled()

    capturedOnMessage?.({ type: "share-command-submitted", commandId: "cmd-1" })
    await vi.waitFor(() =>
      expect(Storage.updateCommands).toHaveBeenCalledWith([
        {
          id: "cmd-1",
          title: "Local",
          contentUpdatedAt: sent.contentUpdatedAt,
          contentHash: calcContentHash(param),
        },
      ]),
    )

    vi.useRealTimers()
  })

  it("SH-09: DUPLICATE_COMMAND_ID awaits updateCommandId before re-sending", async () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

    // Three ticks: two for the HUB_REGISTERED check (isHubRegistered's own
    // await plus the async-function-return microtask), one for the
    // tab-creation await that assigns tabId before the port-connect handler
    // can match it.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]

    let capturedOnMessage: ((msg: unknown) => Promise<void>) | undefined
    const mockPort = {
      name: "hub-share",
      sender: { tab: { id: 42 } },
      postMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn((fn) => {
          capturedOnMessage = fn
        }),
        removeListener: vi.fn(),
      },
    }
    portConnectListener(mockPort as any)
    vi.advanceTimersByTime(100)

    // Simulate DUPLICATE_COMMAND_ID ack
    await capturedOnMessage?.({
      type: "share-command-ack",
      errorCode: "DUPLICATE_COMMAND_ID",
    })

    expect(Settings.updateCommandId).toHaveBeenCalledTimes(1)
    // postMessage for retry must happen after updateCommandId resolves
    expect(mockPort.postMessage).toHaveBeenLastCalledWith({
      type: "share-command",
      command: expect.objectContaining({
        id: expect.not.stringMatching(param.id),
      }),
    })
    expect(mockPort.onMessage.removeListener).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("SH-10: DUPLICATE_COMMAND_ID stops share if updateCommandId fails", async () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    vi.mocked(Settings.updateCommandId).mockRejectedValue(
      new Error("update failed"),
    )
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

    // Three ticks: two for the HUB_REGISTERED check (isHubRegistered's own
    // await plus the async-function-return microtask), one for the
    // tab-creation await that assigns tabId before the port-connect handler
    // can match it.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]

    let capturedOnMessage: ((msg: unknown) => Promise<void>) | undefined
    const mockPort = {
      name: "hub-share",
      sender: { tab: { id: 42 } },
      postMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn((fn) => {
          capturedOnMessage = fn
        }),
        removeListener: vi.fn(),
      },
    }
    portConnectListener(mockPort as any)
    vi.advanceTimersByTime(100)

    // Simulate DUPLICATE_COMMAND_ID ack with updateCommandId failure
    await capturedOnMessage?.({
      type: "share-command-ack",
      errorCode: "DUPLICATE_COMMAND_ID",
    })

    // Must not send a new command with an updated ID since local storage update failed
    expect(mockPort.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        command: expect.objectContaining({
          id: expect.not.stringMatching(param.id),
        }),
      }),
    )
    expect(mockPort.onMessage.removeListener).toHaveBeenCalled()

    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// pushEditToHub (Flow B: Extension-initiated)
// ---------------------------------------------------------------------------

describe("pushEditToHub", () => {
  const param = {
    id: "cmd-1",
    locale: "en",
    targetUrl: "https://example.com",
  } as any
  const sender = {} as any

  it("PE-01: returns true immediately (async response marker)", () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 1 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 1 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    const result = pushEditToHub(param, sender, response)
    expect(result).toBe(true)
  })

  it("PE-02: opens Hub dashboard/commands?id=<commandId> and calls response(true)", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    pushEditToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(true))
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      {
        url: expect.stringContaining(
          "hub.example.com/en/dashboard/mycommands?id=cmd-1",
        ),
      },
      expect.any(Function),
    )
    expect(chrome.runtime.onConnectExternal.addListener).toHaveBeenCalledTimes(
      1,
    )
  })

  it("PE-03: calls response(false) when tab.id is undefined", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({} as chrome.tabs.Tab)
      return Promise.resolve({} as chrome.tabs.Tab)
    })
    const response = vi.fn()
    pushEditToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(false))
    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()
  })

  it("PE-04: calls response(false) when chrome.tabs.create throws", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation(() => {
      throw new Error("tabs.create error")
    })
    const response = vi.fn()
    pushEditToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(false))
    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()
  })

  it("PE-05: ignores hub-edit port from a different tab", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    pushEditToHub(param, sender, response)

    // Let async push() advance past chrome.tabs.create so tabId is set
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    const mockPort = {
      name: "hub-edit",
      sender: { tab: { id: 99 }, origin: HUB_ORIGIN }, // different tab ID
      postMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    }
    portConnectListener(mockPort as any)

    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(true))
    expect(mockPort.postMessage).not.toHaveBeenCalled()
  })

  it("PE-06: ignores hub-edit port from wrong origin", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    pushEditToHub(param, sender, response)

    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    const mockPort = {
      name: "hub-edit",
      sender: { tab: { id: 42 }, origin: "https://evil.example.com" },
      postMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    }
    portConnectListener(mockPort as any)

    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(true))
    expect(mockPort.postMessage).not.toHaveBeenCalled()
  })

  it("PE-07: sends edit-command via hub-edit port (retries) and removes listener on ack", async () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    pushEditToHub(param, sender, response)

    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]

    let capturedOnAck: ((msg: unknown) => void) | undefined
    const mockPort = {
      name: "hub-edit",
      sender: { tab: { id: 42 }, origin: HUB_ORIGIN },
      postMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn((fn) => {
          capturedOnAck = fn
        }),
        removeListener: vi.fn(),
      },
    }
    portConnectListener(mockPort as any)

    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()

    // Advance timer to trigger first retry send
    vi.advanceTimersByTime(200)

    expect(mockPort.postMessage).toHaveBeenCalledWith({
      type: "edit-command",
      command: { ...param, contentUpdatedAt: expect.any(String) },
    })
    const sent = vi.mocked(mockPort.postMessage).mock.calls[0][0].command

    vi.mocked(Storage.getCommands).mockResolvedValue([
      { id: "cmd-1", title: "Local" },
    ] as any)
    capturedOnAck?.({ type: "edit-command-ack" })
    expect(mockPort.onMessage.removeListener).toHaveBeenCalled()

    // The stamp sent to the Hub is saved on the local command.
    await vi.waitFor(() =>
      expect(Storage.updateCommands).toHaveBeenCalledWith([
        {
          id: "cmd-1",
          title: "Local",
          contentUpdatedAt: sent.contentUpdatedAt,
          contentHash: expect.any(String),
        },
      ]),
    )

    vi.useRealTimers()
  })

  it("PE-08: removes listener and logs error when connect timeout passes", async () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    pushEditToHub(param, sender, response)

    await Promise.resolve()

    vi.advanceTimersByTime(10_001)
    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
