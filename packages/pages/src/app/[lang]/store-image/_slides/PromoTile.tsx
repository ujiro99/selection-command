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

/**
 * Rays fanning out from a corner, as in a comic "pop", to show that the
 * popup has just opened. The corner is at the bottom left of the view box;
 * angles are counterclockwise from the right.
 */
const BURST_RAYS = [
  { angle: 12, from: 8, to: 21 },
  { angle: 45, from: 7, to: 27 },
  { angle: 78, from: 8, to: 21 },
] as const

function Burst(): JSX.Element {
  return (
    <svg className={css.burst} viewBox="0 0 32 32" aria-hidden="true">
      {BURST_RAYS.map(({ angle, from, to }) => {
        const rad = (angle * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        return (
          <line
            key={angle}
            x1={from * cos}
            y1={32 - from * sin}
            x2={to * cos}
            y2={32 - to * sin}
          />
        )
      })}
    </svg>
  )
}

/** Illustrate the text selection popup with generic icons. */
function PromoPopup({ more }: { more: boolean }): JSX.Element {
  return (
    <div className={css.popup}>
      <Burst />
      <span className={css.command}>
        <Search className={css.icon} strokeWidth={2.1} />
      </span>
      <span className={`${css.command} ${css.translateCommand}`}>
        <span className={css.active}>
          <Languages className={css.icon} strokeWidth={2.1} />
        </span>
        <span className={css.tooltip}>Translate</span>
      </span>
      <span className={css.command}>
        <WandSparkles className={css.icon} strokeWidth={2.1} />
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
        aria-label="Selecting text opens a menu with search, translation, AI, and video search."
      >
        <div className={css.document}>
          <span className={`${css.line} ${css.line1}`} />
          <div className={css.selectionRow}>
            <span className={`${css.line} ${css.lead}`} />
            <mark>selected text</mark>
            <span className={`${css.line} ${css.trail}`} />
          </div>
          <span className={`${css.line} ${css.lastLine}`} />
        </div>
        <PromoPopup more={marquee} />
        {/* Tip at the end of the selection, as if the drag just ended, under
            the left part of the popup */}
        <Cursor
          scale={marquee ? 1.6 : 0.8}
          style={marquee ? { left: 489, top: 170 } : { left: 235, top: 76 }}
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
