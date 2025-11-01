import { Star, Coffee } from "lucide-react"
import { t } from "@/services/i18n"
import css from "./Option.module.css"

const Parameter =
  "?utm_source=optionPage&utm_medium=link&utm_campaign=developerSupport"
const CHROME_STORE_URL = `https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje${Parameter}`
const COFFEE_URL = `https://buymeacoffee.com/yujiro.takeda${Parameter}`

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
