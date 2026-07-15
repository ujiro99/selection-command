import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import type { WindowLayer } from "@/types"

type updater = (val: BgData) => BgData
type updaterPartial = (val: BgData) => Partial<BgData>

type watchCallback = (newVal: BgData, oldVal: BgData) => void

export type SidePanelTab = {
  tabId: number
  isLinkCommand: boolean
}

export class BgData {
  private static instance: BgData
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

  private constructor(val: BgData | undefined) {
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
    BgData.currentRevision += 1
    return BgData.currentRevision
  }

  public static init() {
    if (BgData.readyPromise) return

    // Provide a safe, empty default synchronously so BgData.get() never
    // returns undefined while the persisted state is still loading.
    BgData.instance = new BgData(undefined)

    BgData.readyPromise = Storage.get<BgData>(SESSION_STORAGE_KEY.BG).then(
      (val: BgData) => {
        BgData.currentRevision = val?.revision ?? 0
        BgData.instance = new BgData(val)
      },
    )
    Storage.addListener(SESSION_STORAGE_KEY.BG, (val: BgData) => {
      // Ignore stale echoes (e.g. of this context's own earlier write) that
      // a more recent local update has already superseded, otherwise they
      // would silently roll back state such as windowStack.
      if ((val?.revision ?? 0) < BgData.currentRevision) {
        return
      }
      BgData.currentRevision = val?.revision ?? BgData.currentRevision
      BgData.instance = new BgData(val)
    })
  }

  // Waits until the persisted state has been loaded at least once, so
  // callers never read or write on top of the synchronous empty default.
  public static async ready(): Promise<void> {
    if (BgData.readyPromise) {
      await BgData.readyPromise
    }
  }

  public static get(): BgData {
    return BgData.instance
  }

  public static async set(val: BgData | updater): Promise<boolean> {
    await BgData.ready()
    const next = val instanceof Function ? val(BgData.instance) : val
    BgData.instance = { ...next, revision: BgData.nextRevision() }
    return Storage.set(SESSION_STORAGE_KEY.BG, BgData.instance)
  }

  public static async update(
    val: Partial<BgData> | updaterPartial,
  ): Promise<boolean> {
    await BgData.ready()
    const partial = val instanceof Function ? val(BgData.instance) : val
    BgData.instance = {
      ...BgData.instance,
      ...partial,
      revision: BgData.nextRevision(),
    }
    return Storage.set(SESSION_STORAGE_KEY.BG, BgData.instance)
  }

  public static watch(cb: watchCallback): () => void {
    return Storage.addListener(SESSION_STORAGE_KEY.BG, cb)
  }
}
