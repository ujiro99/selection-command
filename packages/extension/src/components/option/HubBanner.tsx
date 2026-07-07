import css from "./Option.module.css"
import css2 from "./HubBanner.module.css"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
import { NEW_HUB_URL } from "@/const"
import { useHubUser } from "@/hooks/option/useHubUser"
import { getHubLocale } from "@/services/hubShare"
import { UTM_SOURCE, UTM_MEDIUM, withUtmParams } from "@shared"

const UTM_PARAMS = { source: UTM_SOURCE.OPTION_PAGE, medium: UTM_MEDIUM.BANNER }

export function HubBanner() {
  const hubUser = useHubUser()
  const locale = getHubLocale()
  const hubBannerLink = withUtmParams(
    hubUser
      ? `${NEW_HUB_URL}/${locale}/dashboard/commands`
      : `${NEW_HUB_URL}/${locale}`,
    UTM_PARAMS,
  )

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
