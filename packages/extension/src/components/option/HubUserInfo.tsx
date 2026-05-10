import { useState, useEffect } from "react"
import { LogIn } from "lucide-react"
import { t } from "@/services/i18n"
import { NEW_HUB_URL } from "@/const"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { HubUser } from "@/types"

const HUB_LOGIN_LINK = `${NEW_HUB_URL}/auth/login?utm_source=extension&utm_medium=optionPage`

export function HubUserInfo() {
  const [hubUser, setHubUser] = useState<HubUser | null>(null)

  useEffect(() => {
    Storage.get<HubUser | null>(LOCAL_STORAGE_KEY.HUB_USER).then(setHubUser)

    const unsubscribe = Storage.addListener<HubUser | null>(
      LOCAL_STORAGE_KEY.HUB_USER,
      (newVal) => setHubUser(newVal),
    )
    return unsubscribe
  }, [])

  if (hubUser) {
    return (
      <div className="flex items-center gap-2">
        <img
          className="rounded-full"
          src={hubUser.image}
          alt={hubUser.name}
          width="24"
          height="24"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
        <span className="font-mono text-sm text-gray-700">{hubUser.name}</span>
      </div>
    )
  }

  return (
    <a
      href={HUB_LOGIN_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-2 py-1 rounded-lg text-xs text-gray-600 border border-gray-300 hover:bg-gray-100 hover:scale-105 transition"
    >
      <LogIn size={16} className="mr-2 stroke-gray-600" />
      {t("hub_login")}
    </a>
  )
}
