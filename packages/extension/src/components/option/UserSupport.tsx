import { HelpCircle } from "lucide-react"
import { t } from "@/services/i18n"
import {
  CHROME_WEB_STORE_SUPPORT_URL,
  UTM_SOURCE,
  UTM_MEDIUM,
  withUtmParams,
} from "@shared"
import css from "./Option.module.css"

const SUPPORT_URL = withUtmParams(CHROME_WEB_STORE_SUPPORT_URL, {
  source: UTM_SOURCE.OPTION_PAGE,
  medium: UTM_MEDIUM.LINK,
  campaign: "user-support",
})

export function UserSupport() {
  return (
    <div className={css.menu}>
      <p className={css.menuLabel}>
        <span>{t("usersupport_title")}</span>
      </p>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={css.menuButton}
      >
        <HelpCircle size={18} className="mr-2 stroke-gray-600" />
        {t("usersupport_contact")}
      </a>
      <p className="text-sm text-gray-800 mt-1 ml-2 max-w-60">
        {t("usersupport_description")}
      </p>
    </div>
  )
}
