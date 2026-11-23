import { Cursor, POPUP_MENU, SCREENSHOTS, Screenshot, storeCss } from "../_components/parts"

import css from "./promo.module.css"

/** Shared English artwork for the two non-localized promotional tiles. */
function PromoTile({ marquee = false }: { marquee?: boolean }): JSX.Element {
  const popupWidth = marquee ? 610 : 336
  const popupScale = popupWidth / POPUP_MENU.crop.width

  return (
    <div
      className={`${css.tile} ${marquee ? css.marquee : css.small}`}
      lang="en"
      data-store-slide=""
    >
      <div className={css.brand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/store-image/icon128.png" alt="" />
        <span>Selection Command</span>
      </div>
      <div className={css.copy}>
        <p className={css.headline}>
          {marquee ? <>Search.<br />Translate. AI.</> : "Search. Translate. AI."}
        </p>
        <p className={css.sub}>No copy &amp; paste.</p>
      </div>
      <div className={css.scene}>
        <div className={css.document}>
          <div className={css.line} />
          <div className={css.selectionRow}>
            <span className={css.line} />
            <mark>selected text</mark>
            <span className={css.line} />
          </div>
          <div className={`${css.line} ${css.lastLine}`} />
        </div>
        <Screenshot
          shot={SCREENSHOTS.popupMenu}
          crop={POPUP_MENU.crop}
          scale={popupScale}
          className={storeCss.shotShadow}
          style={{
            left: 0,
            top: 0,
            borderRadius: POPUP_MENU.radius * popupScale,
          }}
        />
        <Cursor
          scale={marquee ? 1.85 : 0.85}
          style={{ right: "18%", bottom: "3%" }}
        />
      </div>
    </div>
  )
}

export function SmallPromoTile(): JSX.Element {
  return <PromoTile />
}

export function MarqueePromoTile(): JSX.Element {
  return <PromoTile marquee />
}
