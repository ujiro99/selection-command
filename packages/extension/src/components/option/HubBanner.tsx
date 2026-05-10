import { useState, useEffect } from "react"
import { LogIn } from "lucide-react"
import css from "./Option.module.css"
import css2 from "./HubBanner.module.css"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
import { HUB_URL, NEW_HUB_URL } from "@/const"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { HubUser } from "@/types"

const HUB_BANNER_LINK = `${HUB_URL}?utm_source=optionPage&utm_medium=banner`
const HUB_LOGIN_LINK = `${NEW_HUB_URL}/auth/signin?utm_source=extension&utm_medium=optionPage`

export function HubBanner() {
  const [hubUser, setHubUser] = useState<HubUser | null>(null)

  useEffect(() => {
    Storage.get<HubUser | null>(LOCAL_STORAGE_KEY.HUB_USER).then(setHubUser)

    const unsubscribe = Storage.addListener<HubUser | null>(
      LOCAL_STORAGE_KEY.HUB_USER,
      (newVal) => setHubUser(newVal),
    )
    return unsubscribe
  }, [])

  return (
    <div className={css.menu}>
      <p className={css2.menuLabel}>
        <span>Sharing Commands</span>
      </p>
      <a href={HUB_BANNER_LINK} target="_blank" rel="noopener noreferrer">
        <img
          className={cn(css2.banner, "shadow-xl rounded-md px-2 pt-2 pb-1")}
          src="/SelectionCommandHub.png"
          alt="Selection Command"
          width="230"
        />
      </a>
      <p className={cn(css2.description, "mt-6")}>
        {t("commandHub_description")}
      </p>
      {hubUser ? (
        <div className={cn(css2.userInfo, "mt-4")}>
          <img
            className={css2.userAvatar}
            src={hubUser.image}
            alt={hubUser.name}
            width="24"
            height="24"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <span className={css2.userName}>{hubUser.name}</span>
        </div>
      ) : (
        <a
          href={HUB_LOGIN_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(css.menuButton, "mt-2")}
        >
          <LogIn size={16} className="mr-2 stroke-gray-600" />
          {t("hub_login")}
        </a>
      )}
    </div>
  )
}
