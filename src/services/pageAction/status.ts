import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import { EXEC_STATE } from '@/const'
import type { PageActiontStatus, PageActionStep } from '@/types'
import { TIMEOUT } from '@/services/pageAction'

export const RunningStatus = {
  clear: async () => {
    await Storage.update<PageActiontStatus>(
      SESSION_STORAGE_KEY.PA_RUNNING,
      (_cur) => ({
        tabId: 0,
        stepId: '',
        results: [],
      }),
    )
  },

  init: async (tabId: number, steps: PageActionStep[]) => {
    const results = steps.map((s) => ({
      stepId: s.id,
      type: s.param.type,
      label: s.param.label,
      status: EXEC_STATE.Queue,
      duration: TIMEOUT,
    }))
    await Storage.set<PageActiontStatus>(SESSION_STORAGE_KEY.PA_RUNNING, {
      tabId,
      stepId: steps[0].id,
      results,
    })
  },

  update: async (
    stepId: string,
    state: EXEC_STATE,
    message?: string,
    duration = TIMEOUT,
  ) => {
    return await Storage.update<PageActiontStatus>(
      SESSION_STORAGE_KEY.PA_RUNNING,
      (status) => ({
        ...status,
        stepId,
        results: status.results.map((r) => {
          if (r.stepId === stepId) {
            return { ...r, status: state, message, duration }
          }
          return r
        }),
      }),
    )
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
