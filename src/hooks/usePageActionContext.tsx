import {
  ReactNode,
  useState,
  useEffect,
  createContext,
  useContext,
} from 'react'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'

type ContextDataType = {
  selectedText: string
  clipboardText: string
}

type ContextType = ContextDataType & {
  setContextData: (data: ContextDataType) => Promise<void>
}

const PageActionContext = createContext<ContextType>({} as ContextType)

export const PageActionContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [selectedText, setSelectedText] = useState<string>('')
  const [clipboardText, setClipboardText] = useState<string>('')

  useEffect(() => {
    Storage.get<ContextDataType>(SESSION_STORAGE_KEY.PAGE_ACTION_CONTEXT).then(
      (data) => {
        if (data) {
          setSelectedText(data.selectedText)
          setClipboardText(data.clipboardText)
        }
      },
    )
  }, [])

  const setContextData = async (data: ContextDataType) => {
    setSelectedText(data.selectedText)
    setClipboardText(data.clipboardText)
    await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION_CONTEXT, data)
  }

  return (
    <PageActionContext.Provider
      value={{
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
