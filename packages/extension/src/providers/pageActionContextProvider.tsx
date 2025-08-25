import { ReactNode, useState, useEffect, useCallback } from "react"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { MultiTabRunningStatus } from "@/services/pageAction"
import { useTabContext } from "@/hooks/useTabContext"
import { pageActionContext } from "@/hooks/pageAction/usePageActionContext"

import type { PageActionContext, MultiTabPageActionStatus } from "@/types"

export const PageActionContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const { tabId, isLoading } = useTabContext()
  const [context, setContext] = useState<PageActionContext>({
    urlChanged: false,
  })

  useEffect(() => {
    if (isLoading || tabId == null) return

    const updateState = async (data: PageActionContext) => {
      if (!data) return
      if (data.recordingTabId != null) {
        data.isRecording = data.recordingTabId === tabId
      }
      setContext((con: PageActionContext) => ({
        ...con,
        ...data,
      }))
    }

    Storage.get<PageActionContext>(SESSION_STORAGE_KEY.PA_CONTEXT).then(
      (data) => {
        updateState(data)
      },
    )

    Storage.addListener<PageActionContext>(
      SESSION_STORAGE_KEY.PA_CONTEXT,
      (data) => {
        updateState(data)
      },
    )

    // Initialize RunningStatus
    MultiTabRunningStatus.getTab(tabId).then((status) => {
      if (status) {
        updateState({ status })
      }
    })

    // subscribe to changes
    const onStatusChange = (allStatus: MultiTabPageActionStatus) => {
      const status = allStatus[tabId]
      updateState({ status })
    }

    return MultiTabRunningStatus.subscribe(onStatusChange)
  }, [tabId, isLoading])

  const setContextData = useCallback(async (data: PageActionContext) => {
    if (!data) return
    const now = await Storage.get<PageActionContext>(
      SESSION_STORAGE_KEY.PA_CONTEXT,
    )
    await Storage.set<PageActionContext>(SESSION_STORAGE_KEY.PA_CONTEXT, {
      ...now,
      ...data,
    })
  }, [])

  return (
    <pageActionContext.Provider
      value={{
        ...context,
        setContextData,
      }}
    >
      {children}
    </pageActionContext.Provider>
  )
}
