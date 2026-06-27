import { useState, useEffect } from "react"
import css from "./Option.module.css"
import css2 from "./HubBanner.module.css"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
import { NEW_HUB_URL } from "@/const"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { HubUser } from "@/types"

const UTM = "utm_source=optionPage&utm_medium=banner"

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

  const hubBannerLink = hubUser
    ? `${NEW_HUB_URL}/dashboard/?${UTM}`
    : `${NEW_HUB_URL}?${UTM}`

  return (
    <div className={css.menu}>
      <p className={css2.menuLabel}>
        <span>Sharing Commands</span>
      </p>
      <a href={hubBannerLink} target="_blank" rel="noopener noreferrer">
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
    </div>
  )
}
