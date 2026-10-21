import { LocaleSelector } from "@/components/LocaleSelector"
import css from "./Footer.module.css"

export function Footer(): JSX.Element {
  return (
    <footer className={css.footer}>
      <hr className={css.separator} />
      <div className={css.content}>
        <p className={css.copyright}>
          <span>© 2024 Selection Command</span>
        </p>
      </div>
      <LocaleSelector />
    </footer>
  )
}
