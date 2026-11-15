import type { Metadata } from "next"

import { SLIDES } from "./_slides"
import css from "./gallery.module.css"

export const metadata: Metadata = {
  title: "Store Images | Selection Command",
  robots: { index: false, follow: false },
}

/** Overview of all store images, to review them side by side. */
export default function StoreImageGalleryPage(): JSX.Element {
  return (
    <main className={css.gallery}>
      <h1 className={css.title}>Chrome Web Store images</h1>
      <ol className={css.list}>
        {Object.entries(SLIDES).map(([key, { title, Slide }]) => (
          <li key={key}>
            <a href={`/store-image/${key}`} className={css.caption}>
              {key}. {title}
            </a>
            {/* Rendered at full size and scaled down to fit the card */}
            <div className={css.frame}>
              <div className={css.scaled}>
                <Slide />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
