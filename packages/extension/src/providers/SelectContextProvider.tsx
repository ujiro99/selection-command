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

    // The stored selection is shared by all tabs, so re-record this tab's
    // selection when the tab becomes active again. An empty selection is not
    // recorded, so that a frame without a selection doesn't overwrite the one
    // recorded by another frame in this tab. (A selection recorded in another
    // tab is ignored by the shortcut handler anyway.)
    const onVisibilitychange = async () => {
      if (!detectSelectionEnabled) return
      if (document.visibilityState !== "visible") return
      const text = getSelectionText()
      if (!text) return
      await setSelectionText(text)
    }

    document.addEventListener("selectionchange", onSelectionchange)
    document.addEventListener("visibilitychange", onVisibilitychange)
    return () => {
      document.removeEventListener("selectionchange", onSelectionchange)
      document.removeEventListener("visibilitychange", onVisibilitychange)
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
