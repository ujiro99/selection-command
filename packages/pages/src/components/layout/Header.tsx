import { Image } from "@/components/Image"
import { MousePointer } from "lucide-react"
import css from "./Header.module.css"
import commonCss from "@/lib/common.module.css"
import { NEW_HUB_URL } from "@/const"

export function Header(): JSX.Element {
  return (
    <div>
      <a href={NEW_HUB_URL} target="_blank" className={commonCss.hover}>
        <header className={css.header}>
          Selection <span className={css.command}>Command</span>
          <span className={css.hub}>Hub</span>
          <MousePointer className={css.mouse} size={26} />
        </header>
      </a>
      <a
        href="https://chromewebstore.google.com/detail/selection-command/nlnhbibaommoelemmdfnkjkgoppkohje?utm_source=selection-command-hub&utm_medium=link&utm_campaign=header"
        target="_blank"
        className={css.storeLink}
        data-gtm-click="chrome-web-store"
      >
        <Image
          src="/chrome_web_store.png"
          alt="Chrome Web Store"
          width={200}
          height={60}
          priority={true}
        />
      </a>
    </div>
  )
}
