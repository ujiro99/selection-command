import { useState, useEffect } from "react"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { HubUser } from "@/types"

export function useHubUser(): HubUser | null {
  const [hubUser, setHubUser] = useState<HubUser | null>(null)

  useEffect(() => {
    Storage.get<HubUser | null>(LOCAL_STORAGE_KEY.HUB_USER).then(setHubUser)
    return Storage.addListener<HubUser | null>(
      LOCAL_STORAGE_KEY.HUB_USER,
      setHubUser,
    )
  }, [])

  return hubUser
}
