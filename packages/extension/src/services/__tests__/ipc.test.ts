import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Ipc, IpcTimeoutError, ServiceWorkerCommand, TabCommand } from "../ipc"
import { ServiceWorkerData } from "@/services/serviceWorkerData"

vi.mock("@/services/serviceWorkerData", () => ({
  ServiceWorkerData: {
    ready: vi.fn(),
    get: vi.fn(),
  },
}))

describe("Ipc.ensureConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ServiceWorkerData.ready).mockResolvedValue(undefined)
  })

  const spyConnectionStrategies = () => {
    const waitForContentScript = vi
      .spyOn(Ipc, "_waitForContentScriptConnection")
      .mockResolvedValue("from content script")
    const serviceWorkerFlow = vi
      .spyOn(Ipc, "_serviceWorkerConnectionFlow")
      .mockResolvedValue("from service worker")
    return { waitForContentScript, serviceWorkerFlow }
  }

  it("IPC-01: 正常系: 読み込み完了後の connectedTabs で接続済みと判定し、接続処理を行わない", async () => {
    // Arrange
    let resolveReady!: () => void
    vi.mocked(ServiceWorkerData.ready).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveReady = resolve
      }),
    )
    vi.mocked(ServiceWorkerData.get).mockReturnValue({
      connectedTabs: [1],
    } as unknown as ServiceWorkerData)
    const { waitForContentScript, serviceWorkerFlow } =
      spyConnectionStrategies()

    // Act
    const done = Ipc.ensureConnection(1)
    await Promise.resolve()

    // Assert: state is not read until it has been loaded
    expect(ServiceWorkerData.get).not.toHaveBeenCalled()

    resolveReady()
    await done

    expect(ServiceWorkerData.get).toHaveBeenCalled()
    expect(waitForContentScript).not.toHaveBeenCalled()
    expect(serviceWorkerFlow).not.toHaveBeenCalled()
  })

  it("IPC-02: 正常系: 未接続のタブでは接続処理を行う", async () => {
    // Arrange
    vi.mocked(ServiceWorkerData.get).mockReturnValue({
      connectedTabs: [],
    } as unknown as ServiceWorkerData)
    const { waitForContentScript, serviceWorkerFlow } =
      spyConnectionStrategies()

    // Act
    await Ipc.ensureConnection(1)

    // Assert
    expect(waitForContentScript).toHaveBeenCalledWith(1)
    expect(serviceWorkerFlow).toHaveBeenCalledWith(1)
  })

  it("IPC-03: 異常系: 読み込みに失敗してもログを出して接続処理を行う", async () => {
    // Arrange
    const error = new Error("storage error")
    vi.mocked(ServiceWorkerData.ready).mockRejectedValue(error)
    vi.mocked(ServiceWorkerData.get).mockReturnValue({
      connectedTabs: [],
    } as unknown as ServiceWorkerData)
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const { serviceWorkerFlow } = spyConnectionStrategies()

    // Act
    await Ipc.ensureConnection(1)

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load service worker data:",
      error,
    )
    expect(serviceWorkerFlow).toHaveBeenCalledWith(1)

    consoleErrorSpy.mockRestore()
  })
})

describe("Ipc.send", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("IPC-04: 正常系: タイムアウト内に応答があれば応答を返す", async () => {
    // Arrange
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue("ok" as never)

    // Act
    const result = await Ipc.send(ServiceWorkerCommand.getTabId, undefined, {
      timeoutMs: 1000,
    })

    // Assert
    expect(result).toBe("ok")
    expect(vi.getTimerCount()).toBe(0)
  })

  it("IPC-05: 異常系: タイムアウトまでに応答がなければ IpcTimeoutError で失敗する", async () => {
    // Arrange: the receiver never answers.
    vi.mocked(chrome.runtime.sendMessage).mockReturnValue(
      new Promise(() => {}) as never,
    )

    // Act
    const promise = Ipc.send(ServiceWorkerCommand.getTabId, undefined, {
      timeoutMs: 1000,
    })
    const assertion = expect(promise).rejects.toBeInstanceOf(IpcTimeoutError)
    await vi.advanceTimersByTimeAsync(1000)

    // Assert
    await assertion
  })

  it("IPC-06: 正常系: タイムアウトを指定しなければ応答を待ち続ける", async () => {
    // Arrange
    let respond!: (value: string) => void
    vi.mocked(chrome.runtime.sendMessage).mockReturnValue(
      new Promise((resolve) => {
        respond = resolve
      }) as never,
    )

    // Act
    const promise = Ipc.send(ServiceWorkerCommand.getTabId)
    await vi.advanceTimersByTimeAsync(60_000)
    respond("late")

    // Assert
    await expect(promise).resolves.toBe("late")
  })

  it("IPC-07: 異常系: 送信エラーはタイムアウトを待たずにそのまま失敗する", async () => {
    // Arrange
    const error = new Error("Receiving end does not exist.")
    vi.mocked(chrome.runtime.sendMessage).mockRejectedValue(error as never)

    // Act & Assert
    await expect(
      Ipc.send(ServiceWorkerCommand.getTabId, undefined, { timeoutMs: 1000 }),
    ).rejects.toBe(error)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("Ipc.addListener", () => {
  const onMessage = vi.mocked(chrome.runtime.onMessage)

  // Returns the wrapper that addListener passed to onMessage.addListener.
  const registeredWrapper = (index = -1) =>
    onMessage.addListener.mock.calls.at(index)?.[0] as (
      request: unknown,
      sender: chrome.runtime.MessageSender,
      response: (res?: unknown) => void,
    ) => boolean

  beforeEach(() => {
    vi.clearAllMocks()
    Ipc.listeners = {}
  })

  it("IPC-08: 正常系: 解除関数は onMessage に登録したラッパーを解除する", () => {
    // Arrange
    const callback = vi.fn(() => false)
    const removeListener = Ipc.addListener(TabCommand.closeMenu, callback)
    const wrapper = registeredWrapper()

    // Act
    removeListener()

    // Assert
    expect(wrapper).not.toBe(callback)
    expect(onMessage.removeListener).toHaveBeenCalledWith(wrapper)
    expect(Ipc.listeners[TabCommand.closeMenu]).toBeUndefined()
  })

  it("IPC-09: 正常系: 同じコマンドを複数登録しても、解除は登録ごとに独立する", () => {
    // Arrange
    const first = vi.fn(() => false)
    const second = vi.fn(() => false)
    const removeFirst = Ipc.addListener(TabCommand.closeMenu, first)
    const firstWrapper = registeredWrapper()
    Ipc.addListener(TabCommand.closeMenu, second)
    const secondWrapper = registeredWrapper()

    // Act
    removeFirst()

    // Assert
    expect(onMessage.removeListener).toHaveBeenCalledTimes(1)
    expect(onMessage.removeListener).toHaveBeenCalledWith(firstWrapper)
    expect(onMessage.removeListener).not.toHaveBeenCalledWith(secondWrapper)
    const remaining = Ipc.listeners[TabCommand.closeMenu]
    expect(remaining).toHaveLength(1)
    remaining[0](undefined, {} as chrome.runtime.MessageSender, vi.fn())
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  it("IPC-10: 正常系: 解除関数を複数回呼んでも 1 回だけ解除する", () => {
    // Arrange
    const removeListener = Ipc.addListener(TabCommand.closeMenu, vi.fn())

    // Act
    removeListener()
    removeListener()

    // Assert
    expect(onMessage.removeListener).toHaveBeenCalledTimes(1)
  })

  it("IPC-15: 正常系: 同じコールバックを 2 回登録しても、解除するのはその登録の分だけ", () => {
    // Arrange: register A, B, then A again.
    const a = vi.fn((_p, _s, response) => {
      response("a")
      return false
    })
    const b = vi.fn((_p, _s, response) => {
      response("b")
      return false
    })
    Ipc.addListener(TabCommand.closeMenu, a)
    Ipc.addListener(TabCommand.closeMenu, b)
    const removeSecondA = Ipc.addListener(TabCommand.closeMenu, a)

    // Act
    removeSecondA()

    // Assert: the first A is kept ahead of B, so it still answers first.
    expect(Ipc.listeners[TabCommand.closeMenu]).toHaveLength(2)
    const response = vi.fn()
    Ipc.listeners[TabCommand.closeMenu][0](
      undefined,
      {} as chrome.runtime.MessageSender,
      response,
    )
    expect(response).toHaveBeenCalledWith("a")
  })

  it("IPC-11: 正常系: ラッパーは対象コマンドのときだけコールバックを呼ぶ", () => {
    // Arrange
    const callback = vi.fn(() => true)
    Ipc.addListener(TabCommand.closeMenu, callback)
    const wrapper = registeredWrapper()
    const sender = {} as chrome.runtime.MessageSender
    const response = vi.fn()

    // Act
    const other = wrapper(
      { command: TabCommand.showToast, param: 1 },
      sender,
      response,
    )
    const own = wrapper(
      { command: TabCommand.closeMenu, param: 2 },
      sender,
      response,
    )

    // Assert
    expect(other).toBe(false)
    expect(own).toBe(true)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(2, sender, response)
  })
})

describe("Ipc.bridgePortToListeners", () => {
  // Builds a port and returns it with its registered onMessage handler.
  const createPort = () => {
    const port = {
      onMessage: { addListener: vi.fn() },
      postMessage: vi.fn(),
      sender: {},
    }
    Ipc.bridgePortToListeners(port as unknown as chrome.runtime.Port)
    const handler = port.onMessage.addListener.mock.calls[0][0] as (
      msg: Record<string, unknown>,
    ) => void
    return { port, handler }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Ipc.listeners = {}
  })

  it("IPC-12: 正常系: 登録中の全コールバックに配信し、最初の応答だけを返す", () => {
    // Arrange
    const first = vi.fn((_p, _s, response) => {
      response("first")
      return false
    })
    const second = vi.fn((_p, _s, response) => {
      response("second")
      return false
    })
    Ipc.addListener(TabCommand.closeMenu, first)
    Ipc.addListener(TabCommand.closeMenu, second)
    const { port, handler } = createPort()

    // Act
    handler({ command: TabCommand.closeMenu, param: "p", id: 1 })

    // Assert
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(port.postMessage).toHaveBeenCalledTimes(1)
    expect(port.postMessage).toHaveBeenCalledWith({
      command: "portResponse",
      id: 1,
      result: "first",
    })
  })

  it("IPC-13: 正常系: 解除済みのコールバックには配信しない", () => {
    // Arrange
    const callback = vi.fn(() => false)
    const removeListener = Ipc.addListener(TabCommand.closeMenu, callback)
    removeListener()
    const { handler } = createPort()

    // Act
    handler({ command: TabCommand.closeMenu, id: 1 })

    // Assert
    expect(callback).not.toHaveBeenCalled()
  })

  it("IPC-14: 異常系: 例外を投げるコールバックがあっても後続のコールバックに配信する", () => {
    // Arrange
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const error = new Error("boom")
    const throwing = vi.fn(() => {
      throw error
    })
    const next = vi.fn((_p, _s, response) => {
      response("next")
      return false
    })
    Ipc.addListener(TabCommand.closeMenu, throwing)
    Ipc.addListener(TabCommand.closeMenu, next)
    const { port, handler } = createPort()

    // Act
    handler({ command: TabCommand.closeMenu, id: 1 })

    // Assert
    expect(next).toHaveBeenCalledTimes(1)
    expect(port.postMessage).toHaveBeenCalledWith({
      command: "portResponse",
      id: 1,
      result: "next",
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Ipc listener threw an error:",
      error,
    )
    consoleErrorSpy.mockRestore()
  })
})
