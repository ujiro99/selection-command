import {
  ReactNode,
  useState,
  useEffect,
  createContext,
  useContext,
} from 'react'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import { Ipc } from '@/services/ipc'
import type { PageActionContext } from '@/types'

type ContextType = PageActionContext & {
  setContextData: (data: PageActionContext) => Promise<void>
}

const PageActionContext = createContext<ContextType>({} as ContextType)

export const PageActionContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isRunning, setIsRunning] = useState<boolean>(false)

  useEffect(() => {
    Storage.get<PageActionContext>(SESSION_STORAGE_KEY.PA_CONTEXT).then(
      (data) => {
        updateState(data)
      },
    )
  }, [])

  const updateState = async (data: PageActionContext) => {
    if (!data) return
    const tabId = await Ipc.getTabId()
    data.recordingTabId && setIsRecording(data.recordingTabId === tabId)
    data.isRunning && setIsRunning(data.isRunning)
  }

  const setContextData = async (data: PageActionContext) => {
    updateState(data)
    await Storage.set(SESSION_STORAGE_KEY.PA_CONTEXT, data)
  }

  return (
    <PageActionContext.Provider
      value={{
        isRecording,
        isRunning,
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
