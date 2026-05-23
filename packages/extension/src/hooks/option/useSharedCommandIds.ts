import { useState, useEffect } from "react"
import { getSharedCommandIds } from "@/services/hubShare"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { HubUser } from "@/types"

/**
 * Hook to fetch shared command IDs from the Selection Command Hub.
 * Returns an empty set when the user is not logged in.
 * Automatically re-fetches when the login state changes.
 */
export function useSharedCommandIds(): Set<string> {
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    let currentHubUser: HubUser | null = null

    const fetchIds = async (hubUser: HubUser | null) => {
      currentHubUser = hubUser
      if (cancelled) return
      if (!hubUser) {
        setSharedIds(new Set())
        return
      }
      const ids = await getSharedCommandIds()
      if (!cancelled) {
        setSharedIds(new Set(ids))
      }
    }

    // Initial fetch
    Storage.get<HubUser | null>(LOCAL_STORAGE_KEY.HUB_USER).then(fetchIds)

    // Re-fetch on login/logout
    const unsubscribe = Storage.addListener<HubUser | null>(
      LOCAL_STORAGE_KEY.HUB_USER,
      (newVal) => fetchIds(newVal),
    )

    // Re-fetch after a command is successfully shared to the hub
    const unsubscribeSharedAt = Storage.addListener<number>(
      LOCAL_STORAGE_KEY.HUB_SHARED_AT,
      () => fetchIds(currentHubUser),
    )

    return () => {
      cancelled = true
      unsubscribe()
      unsubscribeSharedAt()
    }
  }, [])

  return sharedIds
}
