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
  const [runnerId, setRunnerId] = useState<string>('')
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [selectedText, setSelectedText] = useState<string>('')
  const [clipboardText, setClipboardText] = useState<string>('')

  useEffect(() => {
    Storage.get<PageActionContext>(
      SESSION_STORAGE_KEY.PAGE_ACTION_CONTEXT,
    ).then((data) => {
      updateState(data)
    })
  }, [])

  const updateState = async (data: PageActionContext) => {
    if (!data) return
    const tabId = await Ipc.getTabId()
    data.runnerId && setRunnerId(data.runnerId)
    data.recordingTabId && setIsRecording(data.recordingTabId === tabId)
    data.selectedText && setSelectedText(data.selectedText)
    data.clipboardText && setClipboardText(data.clipboardText)
  }

  const setContextData = async (data: PageActionContext) => {
    updateState(data)
    await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION_CONTEXT, data)
  }

  return (
    <PageActionContext.Provider
      value={{
        runnerId,
        isRecording,
        selectedText,
        clipboardText,
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
