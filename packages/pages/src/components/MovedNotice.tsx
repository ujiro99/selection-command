import Link from "next/link"
import { NEW_HUB_URL } from "@/const"
import { MousePointer, SquareArrowOutUpRight } from "lucide-react"
import css from "./MovedNotice.module.css"

/**
 * Notice that points visitors to the new hub, shared by the root page and
 * the 404 page.
 */
export function MovedNotice(): JSX.Element {
  return (
    <div className={css.container}>
      <h1 className={css.title}>
        <Link href={NEW_HUB_URL} className={css.titleLink}>
          Selection
          <span className={css.command}>
            Command
            <MousePointer className={css.mouse} size={26} />
          </span>
          <span className={css.hub}>Hub</span>
        </Link>
      </h1>
      <p className={css.description}>
        is now available at
        <Link href={NEW_HUB_URL} className={css.newHubLink}>
          <SquareArrowOutUpRight className={css.linkIcon} />
          {NEW_HUB_URL}
        </Link>
      </p>
    </div>
  )
}
