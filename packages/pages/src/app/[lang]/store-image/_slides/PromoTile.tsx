import {
  EllipsisVertical,
  Languages,
  MonitorPlay,
  Search,
  Sparkles,
} from "lucide-react"

import { Logo } from "@/components/Logo"

import { Cursor } from "../_components/parts"

import css from "./promo.module.css"

/**
 * Commands shown in the tile popup. The first three follow the copy
 * ("Search. Translate. AI."), then video search. Generic icons instead of
 * service logos, so the artwork needs no third-party brand approval.
 */
const COMMANDS = [Search, Languages, Sparkles, MonitorPlay] as const

/**
 * Popup menu drawn for the tiles. The real screenshot has no translate
 * command and carries service logos, so the tiles use this simplified one
 * styled after it.
 */
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

function PromoPopup({ more }: { more: boolean }): JSX.Element {
  return (
    <div className={css.popup}>
      <Burst />
      {COMMANDS.map((Icon, i) => (
        <span key={i} className={css.command}>
          <Icon className={css.icon} strokeWidth={2.1} />
        </span>
      ))}
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
            <span className={`${css.line} ${css.trail}`} />
          </div>
          <span className={`${css.line} ${css.lastLine}`} />
        </div>
        <PromoPopup more={marquee} />
        {/* Tip at the end of the selection, as if the drag just ended, under
            the left part of the popup */}
        <Cursor
          scale={marquee ? 1.6 : 0.8}
          style={marquee ? { left: 480, top: 164 } : { left: 233, top: 81 }}
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
