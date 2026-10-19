import { useState, ReactNode, useEffect, useCallback, useRef } from "react"
import {
  Storage,
  SESSION_STORAGE_KEY,
  type SelectionTextData,
} from "@/services/storage"
import { Ipc } from "@/services/ipc"
import { getSelectionText } from "@/services/dom"
import { ContextType, selectContext } from "@/hooks/useSelectContext"

const fetchTabId = async (): Promise<number | null> => {
  try {
    return (await Ipc.getTabId()) ?? null
  } catch {
    // e.g. side panel, which does not belong to a tab
    return null
  }
}

export const SelectContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [selectionText, _setSelectionText] = useState("")
  const [target, setTarget] = useState<Element | null>(null)
  const [detectSelectionEnabled, setDetectSelectionEnabled] = useState(true)
  const tabIdRef = useRef<Promise<number | null> | null>(null)

  const setSelectionText = useCallback(async (text: string) => {
    _setSelectionText(text)
    // Record the tab ID with the text, so that the shortcut handler in the
    // service worker can ignore a selection recorded in another tab.
    tabIdRef.current ??= fetchTabId()
    const tabId = await tabIdRef.current
    await Storage.set<SelectionTextData>(SESSION_STORAGE_KEY.SELECTION_TEXT, {
      text,
      tabId,
    })
  }, [])

  useEffect(() => {
    const onSelectionchange = async () => {
      if (!detectSelectionEnabled) return
      const text = getSelectionText()
      await setSelectionText(text)
    }

    document.addEventListener("selectionchange", onSelectionchange)
    return () => {
      document.removeEventListener("selectionchange", onSelectionchange)
    }
  }, [detectSelectionEnabled, setSelectionText])

  const value: ContextType = {
    selectionText,
    setSelectionText,
    target,
    setTarget,
    setDetectSelectionEnabled,
  }

  return (
    <selectContext.Provider value={value}>{children}</selectContext.Provider>
  )
}
