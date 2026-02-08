import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import type { WindowLayer } from "@/types"

type updater = (val: BgData) => BgData
type updaterPartial = (val: BgData) => Partial<BgData>

export class BgData {
  private static instance: BgData

  public windowStack: WindowLayer[]
  public normalWindows: WindowLayer
  public pageActionStop: boolean
  public activeScreenId: string | null
  public connectedTabs: number[]
  public sidePanelTabs: number[]

  private constructor(val: BgData | undefined) {
    this.windowStack = val?.windowStack ?? []
    this.normalWindows = val?.normalWindows ?? []
    this.pageActionStop = val?.pageActionStop ?? false
    this.activeScreenId = val?.activeScreenId ?? null
    this.connectedTabs = val?.connectedTabs ?? []
    this.sidePanelTabs = val?.sidePanelTabs ?? []
  }

  public static init() {
    if (!BgData.instance) {
      Storage.get<BgData>(SESSION_STORAGE_KEY.BG).then((val: BgData) => {
        BgData.instance = new BgData(val)
        console.debug("BgData initialized", BgData.instance)
      })
      Storage.addListener(SESSION_STORAGE_KEY.BG, (val: BgData) => {
        BgData.instance = new BgData(val)
        // console.debug("BgData updated", BgData.instance)
      })
    }
  }

  public static get(): BgData {
    return BgData.instance
  }

  public static set(val: BgData | updater): Promise<boolean> {
    if (val instanceof Function) {
      BgData.instance = val(BgData.instance)
    } else {
      BgData.instance = val
    }
    return Storage.set(SESSION_STORAGE_KEY.BG, BgData.instance)
  }

  public static update(
    val: Partial<BgData> | updaterPartial,
  ): Promise<boolean> {
    if (val instanceof Function) {
      BgData.instance = {
        ...BgData.instance,
        ...val(BgData.instance),
      }
    } else {
      BgData.instance = {
        ...BgData.instance,
        ...val,
      }
    }
    return Storage.set(SESSION_STORAGE_KEY.BG, BgData.instance)
  }
}
