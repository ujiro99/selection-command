import { useState, ReactNode, useEffect } from "react"
import { Ipc } from "@/services/ipc"
import { ContextType, tabContext } from "@/hooks/useTabContext"

export const TabContextProvider = ({ children }: { children: ReactNode }) => {
  const [tabId, setTabId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadTabId = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const id = await Ipc.getTabId()
        setTabId(id)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to get tab ID"))
      } finally {
        setIsLoading(false)
      }
    }

    loadTabId()
  }, [])

  const value: ContextType = {
    tabId,
    isLoading,
    error,
  }

  return <tabContext.Provider value={value}>{children}</tabContext.Provider>
}
