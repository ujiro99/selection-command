import {
  EllipsisVertical,
  Languages,
  MonitorPlay,
  Search,
  Sparkles,
} from "lucide-react"

import { Logo } from "@/components/Logo"

import { Cursor, storeCss } from "../_components/parts"

import css from "./promo.module.css"

/**
 * Commands shown in the tile popup, in the order of the copy
 * ("Search. Translate. AI."), with video search next to web search. Generic
 * icons instead of service logos, so the artwork needs no third-party brand
 * approval.
 */
const COMMANDS = [Search, MonitorPlay, Languages, Sparkles] as const

/**
 * Popup menu drawn for the tiles. The real screenshot has no translate
 * command and carries service logos, so the tiles use this simplified one
 * styled after it.
 */
function PromoPopup(): JSX.Element {
  return (
    <div className={`${css.popup} ${storeCss.shotShadow}`}>
      {COMMANDS.map((Icon, i) => (
        <span key={i} className={css.command}>
          <Icon className={css.icon} strokeWidth={2.1} />
        </span>
      ))}
      <span className={`${css.command} ${css.more}`}>
        <EllipsisVertical className={css.icon} strokeWidth={2.4} />
      </span>
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
          <img src="/store-image/icon128.png" alt="" />
          <Logo variant="xl" hub={false} onDark />
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
      <div className={css.scene}>
        <div className={css.document}>
          <span className={`${css.line} ${css.line1}`} />
          <span className={`${css.line} ${css.line2}`} />
          <div className={css.selectionRow}>
            <span className={`${css.line} ${css.lead}`} />
            <mark>selected text</mark>
            <span className={css.line} />
          </div>
          <span className={`${css.line} ${css.lastLine}`} />
        </div>
        <PromoPopup />
        {/* Tip at the end of the selection, as if the drag just ended, just
            under the popup */}
        <Cursor
          scale={marquee ? 1.6 : 0.8}
          style={marquee ? { left: 420, top: 156 } : { left: 201, top: 80 }}
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
