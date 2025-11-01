import { HelpCircle } from "lucide-react"
import { t } from "@/services/i18n"
import css from "./Option.module.css"

const Parameter =
  "?utm_source=optionPage&utm_medium=link&utm_campaign=userSupport"
const SUPPORT_URL = `https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support${Parameter}`

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
