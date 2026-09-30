import { describe, it, expect, vi, beforeEach } from "vitest"
import { Ipc } from "../ipc"
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
