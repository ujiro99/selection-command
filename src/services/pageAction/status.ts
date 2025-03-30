import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import { EXEC_STATE } from '@/const'
import type { PageActiontStatus, PageActionStep } from '@/types'

export const RunningStatus = {
  init: async (tabId: number, steps: PageActionStep[]) => {
    const results = steps.map((s) => ({
      stepId: s.id,
      type: s.param.type,
      label: s.param.label,
      status: EXEC_STATE.Queue,
    }))
    await Storage.set<PageActiontStatus>(SESSION_STORAGE_KEY.PA_RUNNING, {
      tabId,
      results,
    })
  },

  update: async (stepId: string, state: EXEC_STATE, message?: string) => {
    const status = await Storage.get<PageActiontStatus>(
      SESSION_STORAGE_KEY.PA_RUNNING,
    )
    return await Storage.set(SESSION_STORAGE_KEY.PA_RUNNING, {
      ...status,
      results: status.results.map((r) => {
        if (r.stepId === stepId) {
          return { ...r, status: state, message }
        }
        return r
      }),
    })
  },

  get: async (): Promise<PageActiontStatus> => {
    return await Storage.get<PageActiontStatus>(SESSION_STORAGE_KEY.PA_RUNNING)
  },

  subscribe: (cb: (status: PageActiontStatus) => void) => {
    Storage.addListener<PageActiontStatus>(SESSION_STORAGE_KEY.PA_RUNNING, cb)
  },

  unsubscribe: (cb: (status: PageActiontStatus) => void) => {
    Storage.removeListener(SESSION_STORAGE_KEY.PA_RUNNING, cb)
  },
}
