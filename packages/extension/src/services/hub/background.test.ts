import { describe, it, expect, vi, beforeEach } from "vitest"
import { shareCommandToHub, initHubExternalListener } from "./background"
import { Ipc, BgCommand } from "@/services/ipc"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"

vi.mock("@/services/ipc", () => ({
  Ipc: { callListener: vi.fn() },
  BgCommand: { addCommand: "addCommand", removeCommand: "removeCommand" },
}))

vi.mock("@/services/storage", () => ({
  Storage: { getCommands: vi.fn(), set: vi.fn() },
  LOCAL_STORAGE_KEY: { HUB_USER: "hubUser" },
}))

vi.mock("@/const", () => ({
  NEW_HUB_URL: "https://hub.example.com",
}))

const HUB_ORIGIN = "https://hub.example.com"

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

beforeEach(() => {
  vi.clearAllMocks()
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
      { action: "AddCommand", command: "{}" },
      { origin: "https://evil.example.com" },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
    expect(Ipc.callListener).not.toHaveBeenCalled()
  })

  it("ORIGIN-03: returns false when sender.origin is undefined", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "AddCommand", command: "{}" },
      {},
      sendResponse,
    )
    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — AddCommand
// ---------------------------------------------------------------------------

describe("onMessageExternal - AddCommand", () => {
  it("AC-01: calls Ipc.callListener and forwards result to sendResponse", async () => {
    vi.mocked(Ipc.callListener).mockResolvedValue({ result: true } as any)
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "AddCommand", command: '{"id":"1"}' },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    expect(Ipc.callListener).toHaveBeenCalledWith(BgCommand.addCommand, {
      command: '{"id":"1"}',
    })
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ result: true }),
    )
  })

  it("AC-02: calls sendResponse with result:false when Ipc.callListener rejects", async () => {
    vi.mocked(Ipc.callListener).mockRejectedValue(new Error("IPC error"))
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    listener(
      { action: "AddCommand", command: '{"id":"1"}' },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        result: false,
        error: "IPC error",
      }),
    )
  })

  it("AC-03: does not handle AddCommand when command is not a string", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "AddCommand", command: 42 },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(Ipc.callListener).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — DeleteCommand
// ---------------------------------------------------------------------------

describe("onMessageExternal - DeleteCommand", () => {
  it("DC-01: calls Ipc.callListener and forwards result to sendResponse", async () => {
    vi.mocked(Ipc.callListener).mockResolvedValue({ result: true } as any)
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "DeleteCommand", id: "cmd-123" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    expect(Ipc.callListener).toHaveBeenCalledWith(BgCommand.removeCommand, {
      id: "cmd-123",
    })
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ result: true }),
    )
  })

  it("DC-02: calls sendResponse with result:false when Ipc.callListener rejects", async () => {
    vi.mocked(Ipc.callListener).mockRejectedValue(new Error("IPC error"))
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    listener(
      { action: "DeleteCommand", id: "cmd-123" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        result: false,
        error: "IPC error",
      }),
    )
  })

  it("DC-03: does not handle DeleteCommand when id is not a string", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "DeleteCommand", id: 999 },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(Ipc.callListener).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — RequestInstalledCommand
// ---------------------------------------------------------------------------

describe("onMessageExternal - RequestInstalledCommand", () => {
  it("RI-01: returns installed command IDs via sendResponse", async () => {
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
      }),
    )
  })

  it("RI-02: returns empty installedIds when getCommands rejects", async () => {
    vi.mocked(Storage.getCommands).mockRejectedValue(new Error("storage error"))
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    listener(
      { action: "RequestInstalledCommand" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        action: "SyncInstalledCommand",
        installedIds: [],
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — SetSession
// ---------------------------------------------------------------------------

describe("onMessageExternal - SetSession", () => {
  it("SS-01: stores session data and calls sendResponse with result:true", async () => {
    vi.mocked(Storage.set).mockResolvedValue(true)
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const session = { name: "Test User", image: "https://example.com/avatar.png" }
    const result = listener(
      { action: "SetSession", session },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() => {
      expect(Storage.set).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY.HUB_USER,
        session,
      )
      expect(sendResponse).toHaveBeenCalledWith({ result: true })
    })
  })

  it("SS-02: calls sendResponse with result:false when Storage.set rejects", async () => {
    vi.mocked(Storage.set).mockRejectedValue(new Error("storage error"))
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    listener(
      {
        action: "SetSession",
        session: { name: "Test User", image: "https://example.com/avatar.png" },
      },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        result: false,
        error: "storage error",
      }),
    )
  })

  it("SS-03: returns false when session is missing required fields", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "SetSession", session: { name: "Test User" } },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(Storage.set).not.toHaveBeenCalled()
  })

  it("SS-04: returns false when session is not provided", () => {
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "SetSession" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(false)
    expect(Storage.set).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// onMessageExternal — ClearSession
// ---------------------------------------------------------------------------

describe("onMessageExternal - ClearSession", () => {
  it("CS-01: clears session data and calls sendResponse with result:true", async () => {
    vi.mocked(Storage.set).mockResolvedValue(true)
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    const result = listener(
      { action: "ClearSession" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    expect(result).toBe(true)
    await vi.waitFor(() => {
      expect(Storage.set).toHaveBeenCalledWith(LOCAL_STORAGE_KEY.HUB_USER, null)
      expect(sendResponse).toHaveBeenCalledWith({ result: true })
    })
  })

  it("CS-02: calls sendResponse with result:false when Storage.set rejects", async () => {
    vi.mocked(Storage.set).mockRejectedValue(new Error("storage error"))
    const listener = getRegisteredListener()
    const sendResponse = vi.fn()
    listener(
      { action: "ClearSession" },
      { origin: HUB_ORIGIN },
      sendResponse,
    )
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        result: false,
        error: "storage error",
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// shareCommandToHub
// ---------------------------------------------------------------------------

describe("shareCommandToHub", () => {
  const param = { locale: "en", id: "cmd-1" } as any
  const sender = {} as any

  it("SH-07: returns true immediately (async response marker)", () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 1 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 1 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    const result = shareCommandToHub(param, sender, response)
    expect(result).toBe(true)
  })

  it("SH-01: opens hub tab and calls response(true)", async () => {
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

  it("SH-02: calls response(false) when tab.id is undefined", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({} as chrome.tabs.Tab)
      return Promise.resolve({} as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(false))
  })

  it("SH-03: calls response(false) and removes listener when chrome.tabs.create throws", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation(() => {
      throw new Error("tabs.create error")
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)
    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(false))
    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()
  })

  it("SH-04: ignores port with wrong name", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

    // Simulate port connect with wrong name
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

  it("SH-05: ignores port from a different tab", async () => {
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

    // Let the async share() function resume past the await so `tabId` is initialized
    await Promise.resolve()

    const portConnectListener = vi.mocked(
      chrome.runtime.onConnectExternal.addListener,
    ).mock.calls[0][0]
    const mockPort = {
      name: "hub-share",
      sender: { tab: { id: 99 } }, // different tab ID
      postMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    }
    portConnectListener(mockPort as any)

    await vi.waitFor(() => expect(response).toHaveBeenCalledWith(true))
    expect(mockPort.postMessage).not.toHaveBeenCalled()
  })

  it("SH-06: valid port connect sends share-command and removes listener on ack", async () => {
    vi.useFakeTimers()
    vi.mocked(chrome.tabs.create).mockImplementation((_opts, cb) => {
      cb?.({ id: 42 } as chrome.tabs.Tab)
      return Promise.resolve({ id: 42 } as chrome.tabs.Tab)
    })
    const response = vi.fn()
    shareCommandToHub(param, sender, response)

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

    // Advance timer to trigger first postMessage
    vi.advanceTimersByTime(500)

    expect(mockPort.postMessage).toHaveBeenCalledWith({
      type: "share-command",
      command: param,
    })
    expect(chrome.runtime.onConnectExternal.removeListener).toHaveBeenCalled()

    // Simulate ack
    capturedOnMessage?.({ type: "share-command-ack" })
    expect(mockPort.onMessage.removeListener).toHaveBeenCalled()

    vi.useRealTimers()
  })
})
