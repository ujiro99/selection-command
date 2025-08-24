import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { PAGE_ACTION_EXEC_STATE as EXEC_STATE } from "@/const"
import type {
  MultiTabPageActionStatus,
  PageActiontStatus,
  PageActionStep,
} from "@/types"
import { PAGE_ACTION_TIMEOUT as TIMEOUT } from "@/const"

// Track current tab for single-tab compatibility API
let currentTabId: number | null = null

// Callback storage for proper cleanup
type StatusCallback = (status: PageActiontStatus) => void

export const MultiTabRunningStatus = {
  // Initialize status for a specific tab
  initTab: async (tabId: number, steps: PageActionStep[]) => {
    if (steps.length === 0) {
      throw new Error("Steps array cannot be empty")
    }

    const multiStatus =
      (await Storage.get<MultiTabPageActionStatus>(
        SESSION_STORAGE_KEY.PA_RUNNING,
      )) ?? {}

    // Add new tab status with type safety
    const tabStatus: PageActiontStatus = {
      tabId,
      stepId: steps[0].id,
      results: steps.map((s) => ({
        stepId: s.id,
        type: s.param.type,
        label: s.param.label,
        status: EXEC_STATE.Queue,
        duration: TIMEOUT,
      })),
    }

    multiStatus[tabId] = tabStatus
    await Storage.set(SESSION_STORAGE_KEY.PA_RUNNING, multiStatus)
  },

  // Update status for a specific tab
  updateTab: async (
    tabId: number,
    stepId: string,
    state: EXEC_STATE,
    message?: string,
    duration = TIMEOUT,
  ) => {
    return await Storage.update<MultiTabPageActionStatus>(
      SESSION_STORAGE_KEY.PA_RUNNING,
      (multiStatus) => {
        // Ensure multiStatus is properly typed
        const currentMultiStatus: MultiTabPageActionStatus = multiStatus ?? {}

        // Type-safe check for tab existence
        if (!currentMultiStatus[tabId]) {
          console.warn(`Tab ${tabId} not found in running status`)
          return currentMultiStatus
        }

        const currentTabStatus = currentMultiStatus[tabId]
        const updatedResults = currentTabStatus.results.map((r) =>
          r.stepId === stepId ? { ...r, status: state, message, duration } : r,
        )

        return {
          ...currentMultiStatus,
          [tabId]: {
            ...currentTabStatus,
            stepId,
            results: updatedResults,
          },
        }
      },
    )
  },

  // Get status for a specific tab
  getTab: async (tabId: number): Promise<PageActiontStatus | null> => {
    try {
      const multiStatus = await Storage.get<MultiTabPageActionStatus>(
        SESSION_STORAGE_KEY.PA_RUNNING,
      )
      return multiStatus?.[tabId] ?? null
    } catch (error) {
      console.error("Failed to get tab status:", error)
      return null
    }
  },

  // Get all tab statuses
  getAll: async (): Promise<MultiTabPageActionStatus> => {
    try {
      return (
        (await Storage.get<MultiTabPageActionStatus>(
          SESSION_STORAGE_KEY.PA_RUNNING,
        )) ?? {}
      )
    } catch (error) {
      console.error("Failed to get all tab statuses:", error)
      return {}
    }
  },

  // Clear status for a specific tab
  clearTab: async (tabId: number) => {
    try {
      await Storage.update<MultiTabPageActionStatus>(
        SESSION_STORAGE_KEY.PA_RUNNING,
        (multiStatus) => {
          const currentMultiStatus: MultiTabPageActionStatus = multiStatus ?? {}
          const { [tabId]: removed, ...remaining } = currentMultiStatus
          return remaining
        },
      )
    } catch (error) {
      console.error("Failed to clear tab status:", error)
    }
  },

  // Clear all statuses
  clear: async () => {
    await Storage.set<MultiTabPageActionStatus>(
      SESSION_STORAGE_KEY.PA_RUNNING,
      {},
    )
  },

  // Subscribe to status changes
  subscribe: (cb: (status: MultiTabPageActionStatus) => void) => {
    Storage.addListener<MultiTabPageActionStatus>(
      SESSION_STORAGE_KEY.PA_RUNNING,
      cb,
    )
  },

  // Unsubscribe from status changes
  unsubscribe: (cb: (status: MultiTabPageActionStatus) => void) => {
    Storage.removeListener(SESSION_STORAGE_KEY.PA_RUNNING, cb)
  },
}

// Single-tab compatibility API (unified interface)
export const RunningStatus = {
  // Initialize status for current tab
  init: async (tabId: number, steps: PageActionStep[]) => {
    currentTabId = tabId
    return await MultiTabRunningStatus.initTab(tabId, steps)
  },

  // Update status for current tab
  update: async (
    stepId: string,
    state: EXEC_STATE,
    message?: string,
    duration = TIMEOUT,
  ) => {
    if (currentTabId === null) {
      console.warn("No current tab set for RunningStatus.update")
      return
    }
    return await MultiTabRunningStatus.updateTab(
      currentTabId,
      stepId,
      state,
      message,
      duration,
    )
  },

  // Get status for current tab
  get: async (): Promise<PageActiontStatus> => {
    if (currentTabId === null) {
      // Return empty status if no current tab
      return {
        tabId: 0,
        stepId: "",
        results: [],
      }
    }
    const status = await MultiTabRunningStatus.getTab(currentTabId)
    return (
      status || {
        tabId: currentTabId,
        stepId: "",
        results: [],
      }
    )
  },

  // Clear current tab status
  clear: async () => {
    if (currentTabId !== null) {
      await MultiTabRunningStatus.clearTab(currentTabId)
    }
    currentTabId = null
  },

  // Subscribe to current tab status changes
  subscribe: (cb: StatusCallback) => {
    const listener = (multiStatus: MultiTabPageActionStatus) => {
      if (currentTabId !== null && multiStatus[currentTabId]) {
        cb(multiStatus[currentTabId])
      }
    }
    Storage.addListener<MultiTabPageActionStatus>(
      SESSION_STORAGE_KEY.PA_RUNNING,
      listener,
    )
    return () => {
      Storage.removeListener(SESSION_STORAGE_KEY.PA_RUNNING, listener)
    }
  },
}
