import {
  ReactNode,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { useTabContext } from "@/hooks/useTabContext"
import type { PageActionContext } from "@/types"

type ContextType = PageActionContext & {
  setContextData: (data: PageActionContext) => Promise<void>
}

const PageActionContext = createContext<ContextType>({} as ContextType)

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
  }, [tabId, isLoading])

  const setContextData = async (data: PageActionContext) => {
    if (!data) return
    const now = await Storage.get<PageActionContext>(
      SESSION_STORAGE_KEY.PA_CONTEXT,
    )
    await Storage.set<PageActionContext>(SESSION_STORAGE_KEY.PA_CONTEXT, {
      ...now,
      ...data,
    })
  }

  return (
    <PageActionContext.Provider
      value={{
        ...context,
        setContextData,
      }}
    >
      {children}
    </PageActionContext.Provider>
  )
}

export const usePageActionContext = (): ContextType => {
  return useContext(PageActionContext)
}
