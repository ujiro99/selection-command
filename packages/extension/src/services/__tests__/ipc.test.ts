import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  Ipc,
  IpcNoReplyError,
  IpcTimeoutError,
  PortReply,
  ServiceWorkerCommand,
  TabCommand,
} from "../ipc"
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
  const sender = {} as chrome.runtime.MessageSender

  beforeEach(() => {
    vi.clearAllMocks()
    Ipc.listeners = {}
  })

  it("IPC-08: 正常系: 解除するとそのコールバックには配信しない", () => {
    // Arrange
    const callback = vi.fn(() => false)
    const removeListener = Ipc.addListener(TabCommand.closeMenu, callback)

    // Act
    removeListener()
    const handled = Ipc.handleMessage(
      { command: TabCommand.closeMenu, param: undefined },
      sender,
      vi.fn(),
    )

    // Assert
    expect(handled).toBe(false)
    expect(callback).not.toHaveBeenCalled()
    expect(Ipc.listeners[TabCommand.closeMenu]).toBeUndefined()
  })

  it("IPC-09: 正常系: 同じコマンドを複数登録しても、解除は登録ごとに独立する", () => {
    // Arrange
    const first = vi.fn(() => false)
    const second = vi.fn(() => false)
    const removeFirst = Ipc.addListener(TabCommand.closeMenu, first)
    Ipc.addListener(TabCommand.closeMenu, second)

    // Act
    removeFirst()
    Ipc.handleMessage(
      { command: TabCommand.closeMenu, param: undefined },
      sender,
      vi.fn(),
    )

    // Assert
    expect(Ipc.listeners[TabCommand.closeMenu]).toHaveLength(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  it("IPC-10: 正常系: 解除関数を複数回呼んでも、ほかの登録は解除しない", () => {
    // Arrange
    const callback = vi.fn(() => false)
    const removeFirst = Ipc.addListener(TabCommand.closeMenu, callback)
    Ipc.addListener(TabCommand.closeMenu, callback)

    // Act
    removeFirst()
    removeFirst()

    // Assert
    expect(Ipc.listeners[TabCommand.closeMenu]).toHaveLength(1)
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
    const response = vi.fn()
    Ipc.handleMessage(
      { command: TabCommand.closeMenu, param: undefined },
      sender,
      response,
    )

    // Assert: the first A is kept ahead of B, so it still answers first.
    expect(Ipc.listeners[TabCommand.closeMenu]).toHaveLength(2)
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    expect(response).toHaveBeenCalledTimes(1)
    expect(response).toHaveBeenCalledWith("a")
  })

  it("IPC-16: 正常系: 何回登録しても onMessage のリスナーは 1 つだけ登録する", async () => {
    // Arrange: a fresh module has not registered its listener yet.
    vi.resetModules()
    const { Ipc: FreshIpc } = await import("../ipc")

    // Act
    const remove = FreshIpc.addListener(TabCommand.closeMenu, vi.fn())
    FreshIpc.addListener(TabCommand.showToast, vi.fn())
    remove()
    FreshIpc.addListener(TabCommand.closeMenu, vi.fn())

    // Assert
    const onMessage = vi.mocked(chrome.runtime.onMessage)
    expect(onMessage.addListener).toHaveBeenCalledTimes(1)
    expect(onMessage.addListener).toHaveBeenCalledWith(FreshIpc.handleMessage)
    expect(onMessage.removeListener).not.toHaveBeenCalled()
  })
})

describe("Ipc.handleMessage", () => {
  const sender = {} as chrome.runtime.MessageSender

  beforeEach(() => {
    vi.clearAllMocks()
    Ipc.listeners = {}
  })

  it("IPC-11: 正常系: 対象コマンドのコールバックだけを呼ぶ", () => {
    // Arrange
    const callback = vi.fn(() => true)
    Ipc.addListener(TabCommand.closeMenu, callback)
    const response = vi.fn()

    // Act
    const other = Ipc.handleMessage(
      { command: TabCommand.showToast, param: 1 },
      sender,
      response,
    )
    const own = Ipc.handleMessage(
      { command: TabCommand.closeMenu, param: 2 },
      sender,
      response,
    )

    // Assert
    expect(other).toBe(false)
    expect(own).toBe(true)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(2, sender, expect.any(Function))
  })

  it("IPC-17: 正常系: 後で応答するコールバックがあれば true を返し、その応答を返す", () => {
    // Arrange
    let respondLater: ((res?: unknown) => void) | undefined
    Ipc.addListener(TabCommand.closeMenu, () => false)
    Ipc.addListener(TabCommand.closeMenu, (_p, _s, response) => {
      respondLater = response
      return true
    })
    const response = vi.fn()

    // Act
    const keepOpen = Ipc.handleMessage(
      { command: TabCommand.closeMenu, param: undefined },
      sender,
      response,
    )
    respondLater?.("later")

    // Assert
    expect(keepOpen).toBe(true)
    expect(response).toHaveBeenCalledTimes(1)
    expect(response).toHaveBeenCalledWith("later")
  })

  it("IPC-18: 正常系: 誰も応答しなければ false を返し、自分では応答しない", () => {
    // Arrange: a listener in another context may still respond.
    Ipc.addListener(TabCommand.closeMenu, () => false)
    const response = vi.fn()

    // Act
    const keepOpen = Ipc.handleMessage(
      { command: TabCommand.closeMenu, param: undefined },
      sender,
      response,
    )

    // Assert
    expect(keepOpen).toBe(false)
    expect(response).not.toHaveBeenCalled()
  })

  it("IPC-19: 正常系: 同期的に応答したら、後で応答するコールバックがあっても false を返す", () => {
    // Arrange
    Ipc.addListener(TabCommand.closeMenu, (_p, _s, response) => {
      response("now")
      return false
    })
    Ipc.addListener(TabCommand.closeMenu, () => true)
    const response = vi.fn()

    // Act
    const keepOpen = Ipc.handleMessage(
      { command: TabCommand.closeMenu, param: undefined },
      sender,
      response,
    )

    // Assert
    expect(keepOpen).toBe(false)
    expect(response).toHaveBeenCalledWith("now")
  })
})

describe("Ipc.handleMessage - inherited command names", () => {
  it("IPC-26: 異常系: Object.prototype のメンバー名のコマンドは false を返す", () => {
    // Arrange
    Ipc.listeners = {}
    const response = vi.fn()

    // Act
    const result = Ipc.handleMessage(
      { command: "constructor" as TabCommand, param: undefined },
      {} as chrome.runtime.MessageSender,
      response,
    )

    // Assert
    expect(result).toBe(false)
    expect(response).not.toHaveBeenCalled()
  })
})

describe("Ipc.callListener", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Ipc.listeners = {}
  })

  it("IPC-20: 異常系: どのコールバックも応答しなければ IpcNoReplyError で拒否する", async () => {
    // Arrange
    Ipc.addListener(ServiceWorkerCommand.onHidden, () => false)

    // Act & Assert
    await expect(
      Ipc.callListener(ServiceWorkerCommand.onHidden),
    ).rejects.toBeInstanceOf(IpcNoReplyError)
  })

  it("IPC-21: 正常系: 後で応答するコールバックがあれば、その応答で解決する", async () => {
    // Arrange
    Ipc.addListener(ServiceWorkerCommand.getTabId, () => false)
    Ipc.addListener(ServiceWorkerCommand.getTabId, (_p, _s, response) => {
      setTimeout(() => response(42), 0)
      return true
    })

    // Act
    const result = await Ipc.callListener(ServiceWorkerCommand.getTabId)

    // Assert
    expect(result).toBe(42)
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

  it("IPC-22: 正常系: どのコールバックも応答しなければ no-reply を返す", () => {
    // Arrange
    Ipc.addListener(TabCommand.closeMenu, () => false)
    const { port, handler } = createPort()

    // Act
    handler({ command: TabCommand.closeMenu, id: 1 })

    // Assert
    expect(port.postMessage).toHaveBeenCalledTimes(1)
    expect(port.postMessage).toHaveBeenCalledWith({
      command: PortReply.noReply,
      id: 1,
    })
  })

  it("IPC-24: 異常系: コールバックが例外を投げて応答しなければ no-reply を返し、後からの応答は無視する", () => {
    // Arrange
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    let lateResponse: ((res?: unknown) => void) | undefined
    Ipc.addListener(TabCommand.closeMenu, (_p, _s, response) => {
      lateResponse = response
      throw new Error("boom")
    })
    const { port, handler } = createPort()

    // Act
    handler({ command: TabCommand.closeMenu, id: 1 })
    lateResponse?.("late")

    // Assert
    expect(port.postMessage).toHaveBeenCalledTimes(1)
    expect(port.postMessage).toHaveBeenCalledWith({
      command: PortReply.noReply,
      id: 1,
    })
    consoleErrorSpy.mockRestore()
  })

  it("IPC-25: 異常系: Object.prototype のメンバー名のコマンドは無視する", () => {
    // Arrange
    const { port, handler } = createPort()

    // Act & Assert
    expect(() => handler({ command: "constructor", id: 1 })).not.toThrow()
    expect(port.postMessage).not.toHaveBeenCalled()
  })

  it("IPC-23: 正常系: 後で応答するコールバックがあれば、その応答を待って返す", () => {
    // Arrange
    let respondLater: ((res?: unknown) => void) | undefined
    Ipc.addListener(TabCommand.closeMenu, (_p, _s, response) => {
      respondLater = response
      return true
    })
    const { port, handler } = createPort()

    // Act
    handler({ command: TabCommand.closeMenu, id: 1 })
    const postedBefore = port.postMessage.mock.calls.length
    respondLater?.("later")

    // Assert
    expect(postedBefore).toBe(0)
    expect(port.postMessage).toHaveBeenCalledTimes(1)
    expect(port.postMessage).toHaveBeenCalledWith({
      command: "portResponse",
      id: 1,
      result: "later",
    })
  })
})
