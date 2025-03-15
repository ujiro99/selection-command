import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import type { WindowLayer } from '@/types'

export class BgData {
  private static instance: BgData

  public windowStack: WindowLayer[]
  public normalWindows: WindowLayer

  private constructor(val: BgData | undefined) {
    this.windowStack = val?.windowStack ?? []
    this.normalWindows = val?.normalWindows ?? []
  }

  public static init() {
    if (!BgData.instance) {
      Storage.get<BgData>(SESSION_STORAGE_KEY.BG).then((val: BgData) => {
        BgData.instance = new BgData(val)
        console.debug('BgData initialized', BgData.instance)
      })
      Storage.addListener(SESSION_STORAGE_KEY.BG, (val: BgData) => {
        BgData.instance = new BgData(val)
        console.debug('BgData updated', BgData.instance)
      })
    }
  }

  public static get(): BgData {
    return BgData.instance
  }

  public static set(val: BgData) {
    BgData.instance = val
    Storage.set(SESSION_STORAGE_KEY.BG, BgData.instance)
  }
}
