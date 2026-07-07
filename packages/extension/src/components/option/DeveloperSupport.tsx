import { Star, Coffee } from "lucide-react"
import { t } from "@/services/i18n"
import {
  CHROME_WEB_STORE_REVIEWS_URL,
  UTM_SOURCE,
  UTM_MEDIUM,
  withUtmParams,
} from "@shared"
import css from "./Option.module.css"

const UTM_PARAMS = {
  source: UTM_SOURCE.OPTION_PAGE,
  medium: UTM_MEDIUM.LINK,
  campaign: "developer-support",
}
const CHROME_STORE_URL = withUtmParams(CHROME_WEB_STORE_REVIEWS_URL, UTM_PARAMS)
const COFFEE_URL = withUtmParams(
  "https://buymeacoffee.com/yujiro.takeda",
  UTM_PARAMS,
)

export function DeveloperSupport() {
  return (
    <div className={css.menu}>
      <p className={css.menuLabel}>
        <span>{t("developersupport_title")}</span>
      </p>
      <a
        href={CHROME_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={css.menuButton}
      >
        <Star size={18} className="mr-2 stroke-gray-600" />
        {t("developersupport_review")}
      </a>
      <a
        href={COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={css.menuButton}
      >
        <Coffee size={18} className="mr-2 stroke-gray-600" />
        {t("developersupport_coffee")}
      </a>
    </div>
  )
}
