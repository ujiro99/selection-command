import css from "./Option.module.css"
import css2 from "./HubBanner.module.css"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
import { NEW_HUB_URL } from "@/const"
import { useHubUser } from "@/hooks/option/useHubUser"
import { useThemeContext } from "@/hooks/useTheme"
import { getHubLocale } from "@/services/hubShare"
import { sendHubLinkClick, HUB_LINK_ROUTE } from "@/services/analytics"
import { UTM_SOURCE, UTM_MEDIUM, withUtmParams } from "@shared"

const UTM_PARAMS = { source: UTM_SOURCE.OPTION_PAGE, medium: UTM_MEDIUM.BANNER }

export function HubBanner() {
  const hubUser = useHubUser()
  const isDark = useThemeContext() === "dark"
  const locale = getHubLocale()
  const hubBannerLink = withUtmParams(
    hubUser
      ? `${NEW_HUB_URL}/${locale}/dashboard/commands`
      : `${NEW_HUB_URL}/${locale}/commands`,
    UTM_PARAMS,
  )

  return (
    <div className={css.menu}>
      <p className={css2.menuLabel}>
        <span>Sharing Commands</span>
      </p>
      <a
        href={hubBannerLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => sendHubLinkClick(HUB_LINK_ROUTE.BANNER)}
      >
        <img
          className={css2.banner}
          // The image has dark text on a transparent background, so the dark
          // theme uses a variant with the lightness inverted (hue kept).
          src={
            isDark
              ? "/SelectionCommandHub_dark.png"
              : "/SelectionCommandHub.png"
          }
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
