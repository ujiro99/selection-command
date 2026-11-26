import {
  EllipsisVertical,
  Languages,
  MonitorPlay,
  Search,
  WandSparkles,
} from "lucide-react"

import { Logo } from "@/components/Logo"

import { Cursor, STORE_ICON_SRC } from "../_components/parts"

import css from "./promo.module.css"

/** The popup opens above the end of the text selection. */
function Burst(): JSX.Element {
  return (
    <svg className={css.burst} viewBox="0 0 32 18" aria-hidden="true">
      <path d="m10 5-6 5m12-4v8m6-9 6 5" />
    </svg>
  )
}

/** Illustrate the default command hierarchy with generic icons. */
function PromoPopup({ more }: { more: boolean }): JSX.Element {
  return (
    <div className={css.popup}>
      <span className={css.command}>
        <Search className={css.icon} strokeWidth={2.1} />
      </span>
      <span className={`${css.command} ${css.aiCommand}`}>
        <span className={css.active}>
          <WandSparkles className={css.icon} strokeWidth={2.1} />
        </span>
        <span className={css.submenu}>
          <Languages className={css.translationIcon} strokeWidth={2.1} />
          Translate
        </span>
      </span>
      <span className={css.command}>
        <MonitorPlay className={css.icon} strokeWidth={2.1} />
      </span>
      {/* Too small to read on the small tile, so only on the marquee */}
      {more && (
        <span className={`${css.command} ${css.more}`}>
          <EllipsisVertical className={css.icon} strokeWidth={2.4} />
        </span>
      )}
    </div>
  )
}

/** Shared English artwork for the two non-localized promotional tiles. */
function PromoTile({ marquee = false }: { marquee?: boolean }): JSX.Element {
  return (
    <div
      className={`${css.tile} ${marquee ? css.marquee : css.small}`}
      lang="en"
      data-store-slide=""
    >
      {/* Only on the marquee: the small tile needs the room for the scene,
          and the store shows the name and icon next to it anyway */}
      {marquee && (
        <div className={css.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={STORE_ICON_SRC} alt="" />
          <Logo variant="xl" hub={false} onDark className={css.wordmark} />
        </div>
      )}
      <div className={css.copy}>
        <p className={css.headline}>
          {marquee ? (
            <>
              Search.
              <br />
              Translate. AI.
            </>
          ) : (
            "Search. Translate. AI."
          )}
        </p>
        <p className={css.sub}>No copy &amp; paste.</p>
      </div>
      {/* A page with a selection, and the popup opening at the cursor */}
      <div
        className={css.scene}
        role="img"
        aria-label="Selecting text opens a menu with search, AI options including translation, and video search."
      >
        <div className={css.document}>
          <span className={`${css.line} ${css.line1}`} />
          <span className={`${css.line} ${css.line2}`} />
          <div className={css.selectionRow}>
            <span className={`${css.line} ${css.lead}`} />
            <mark>selected text</mark>
            <span className={`${css.line} ${css.trail}`} />
          </div>
          <span className={`${css.line} ${css.lastLine}`} />
        </div>
        <PromoPopup more={marquee} />
        <Burst />
        {/* Tip at the end of the selection, as if the drag just ended, under
            the left part of the popup */}
        <Cursor
          scale={marquee ? 1.6 : 0.8}
          style={{ left: "var(--cursor-left)", top: "var(--cursor-top)" }}
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
