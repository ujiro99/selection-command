import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Ipc, IpcTimeoutError, ServiceWorkerCommand } from "../ipc"
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
