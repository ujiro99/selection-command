import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import type { WindowLayer } from "@/types"

type updater = (val: BgData) => BgData

export class BgData {
  private static instance: BgData

  public windowStack: WindowLayer[]
  public normalWindows: WindowLayer
  public pageActionStop: boolean
  public activeScreenId: string | null

  private constructor(val: BgData | undefined) {
    this.windowStack = val?.windowStack ?? []
    this.normalWindows = val?.normalWindows ?? []
    this.pageActionStop = val?.pageActionStop ?? false
    this.activeScreenId = val?.activeScreenId ?? null
  }

  public static init() {
    if (!BgData.instance) {
      Storage.get<BgData>(SESSION_STORAGE_KEY.BG).then((val: BgData) => {
        BgData.instance = new BgData(val)
        console.debug("BgData initialized", BgData.instance)
      })
      Storage.addListener(SESSION_STORAGE_KEY.BG, (val: BgData) => {
        BgData.instance = new BgData(val)
        console.debug("BgData updated", BgData.instance)
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
}
