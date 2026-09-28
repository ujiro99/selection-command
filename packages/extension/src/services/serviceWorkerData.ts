import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import type { WindowLayer } from "@/types"

type updater = (val: ServiceWorkerData) => ServiceWorkerData
type updaterPartial = (val: ServiceWorkerData) => Partial<ServiceWorkerData>

type watchCallback = (
  newVal: ServiceWorkerData,
  oldVal: ServiceWorkerData,
) => void

export type SidePanelTab = {
  tabId: number
  isLinkCommand: boolean
}

export class ServiceWorkerData {
  private static instance: ServiceWorkerData
  // Resolves once the persisted state has been loaded at least once.
  private static readyPromise: Promise<void> | null = null
  // Highest revision this context has written or observed. Used to reject
  // stale chrome.storage.onChanged echoes (including echoes of this
  // context's own writes) that would otherwise roll back newer local state.
  private static currentRevision = 0

  public windowStack: WindowLayer[]
  public normalWindows: WindowLayer
  public pageActionStop: boolean
  public activeTabId: number | null
  public connectedTabs: number[]
  public sidePanelTabs: SidePanelTab[]
  public sidePanelUrls: Record<number, string>
  public revision: number

  private constructor(val: ServiceWorkerData | undefined) {
    this.windowStack = val?.windowStack ?? []
    this.normalWindows = val?.normalWindows ?? []
    this.pageActionStop = val?.pageActionStop ?? false
    this.activeTabId = val?.activeTabId ?? null
    this.connectedTabs = val?.connectedTabs ?? []
    // Normalize sidePanelTabs: convert legacy number[] entries to SidePanelTab objects
    this.sidePanelTabs = (val?.sidePanelTabs ?? []).map((t) =>
      typeof t === "number" ? { tabId: t, isLinkCommand: false } : t,
    )
    this.sidePanelUrls = val?.sidePanelUrls ?? {}
    this.revision = val?.revision ?? 0
  }

  // Advances and returns the revision to stamp on a local write.
  private static nextRevision(): number {
    ServiceWorkerData.currentRevision += 1
    return ServiceWorkerData.currentRevision
  }

  public static init() {
    if (ServiceWorkerData.readyPromise) return

    // Provide a safe, empty default synchronously so ServiceWorkerData.get() never
    // returns undefined while the persisted state is still loading.
    ServiceWorkerData.instance = new ServiceWorkerData(undefined)

    ServiceWorkerData.readyPromise = Storage.get<ServiceWorkerData>(
      SESSION_STORAGE_KEY.SERVICE_WORKER_DATA,
    ).then((val: ServiceWorkerData) => {
      ServiceWorkerData.currentRevision = val?.revision ?? 0
      ServiceWorkerData.instance = new ServiceWorkerData(val)
    })
    Storage.addListener(
      SESSION_STORAGE_KEY.SERVICE_WORKER_DATA,
      (val: ServiceWorkerData) => {
        // Ignore stale echoes (e.g. of this context's own earlier write) that
        // a more recent local update has already superseded, otherwise they
        // would silently roll back state such as windowStack.
        if ((val?.revision ?? 0) < ServiceWorkerData.currentRevision) {
          return
        }
        ServiceWorkerData.currentRevision =
          val?.revision ?? ServiceWorkerData.currentRevision
        ServiceWorkerData.instance = new ServiceWorkerData(val)
      },
    )
  }

  // Waits until the persisted state has been loaded at least once, so
  // callers never read or write on top of the synchronous empty default.
  public static async ready(): Promise<void> {
    if (ServiceWorkerData.readyPromise) {
      await ServiceWorkerData.readyPromise
    }
  }

  public static get(): ServiceWorkerData {
    return ServiceWorkerData.instance
  }

  public static async set(val: ServiceWorkerData | updater): Promise<boolean> {
    await ServiceWorkerData.ready()
    const next = val instanceof Function ? val(ServiceWorkerData.instance) : val
    ServiceWorkerData.instance = {
      ...next,
      revision: ServiceWorkerData.nextRevision(),
    }
    return Storage.set(
      SESSION_STORAGE_KEY.SERVICE_WORKER_DATA,
      ServiceWorkerData.instance,
    )
  }

  public static async update(
    val: Partial<ServiceWorkerData> | updaterPartial,
  ): Promise<boolean> {
    await ServiceWorkerData.ready()
    const partial =
      val instanceof Function ? val(ServiceWorkerData.instance) : val
    ServiceWorkerData.instance = {
      ...ServiceWorkerData.instance,
      ...partial,
      revision: ServiceWorkerData.nextRevision(),
    }
    return Storage.set(
      SESSION_STORAGE_KEY.SERVICE_WORKER_DATA,
      ServiceWorkerData.instance,
    )
  }

  public static watch(cb: watchCallback): () => void {
    return Storage.addListener(SESSION_STORAGE_KEY.SERVICE_WORKER_DATA, cb)
  }
}
