import type { CSSProperties, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { Logo } from "@/components/Logo"

import css from "./store.module.css"

export type Chip = { label: string; icon: LucideIcon }

interface StoreSlideProps {
  /** Small line above the headline. */
  eyebrow: string
  /** Two headline lines; the second one is drawn in the accent color. */
  headline: [string, string]
  lead: ReactNode
  chipsHeading: string
  chips: Chip[]
  /** Optional small text under the chips. */
  note?: ReactNode
  /** Content of the right-hand scene (browser mock and overlays). */
  children: ReactNode
}

/**
 * Common layout of every store image: brand and copy on the left, a tilted
 * scene on the right. Rendered at a fixed 1280x800.
 */
export function StoreSlide({
  eyebrow,
  headline,
  lead,
  chipsHeading,
  chips,
  note,
  children,
}: StoreSlideProps): JSX.Element {
  return (
    <div className={css.canvas}>
      <div className={css.glow} aria-hidden />

      <section className={css.copy}>
        <div className={css.brand}>
          {/* Plain img: next/image would point at /_next/image, which
              does not exist in the static export. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/store-image/icon128.png"
            alt=""
            width={44}
            height={44}
            className={css.brandIcon}
          />
          <Logo variant="lg" hub={false} />
        </div>

        <p className={css.eyebrow}>{eyebrow}</p>

        <h1 className={css.headline}>
          <span>{headline[0]}</span>
          <span className={css.headlineAccent}>{headline[1]}</span>
        </h1>

        <p className={css.lead}>{lead}</p>

        <p className={css.chipsHeading}>{chipsHeading}</p>
        <ul className={css.chips}>
          {chips.map(({ label, icon: Icon }) => (
            <li key={label} className={css.chip}>
              <Icon size={17} strokeWidth={2.4} className={css.chipIcon} />
              {label}
            </li>
          ))}
        </ul>
        {note && <p className={css.note}>{note}</p>}
      </section>

      <div className={css.scene} aria-hidden>
        {children}
      </div>
    </div>
  )
}

interface BrowserMockProps {
  url: string
  children: ReactNode
  /** Render as a smaller floating window instead of the main browser. */
  floating?: boolean
  style?: CSSProperties
}

/** Browser frame with an address bar. */
export function BrowserMock({
  url,
  children,
  floating = false,
  style,
}: BrowserMockProps): JSX.Element {
  return (
    <div className={floating ? css.window : css.browser} style={style}>
      <div className={css.toolbar}>
        <span className={css.dots}>
          <i />
          <i />
          <i />
        </span>
        <span className={css.address}>{url}</span>
      </div>
      {children}
    </div>
  )
}

export type MenuItem = { icon: LucideIcon; label?: string }

interface MenuBarProps {
  items: MenuItem[]
  /** Index of the hovered item, if any. */
  activeIndex?: number
  style?: CSSProperties
}

/** Icon menu bar, modeled after the extension's selection popup. */
export function MenuBar({
  items,
  activeIndex,
  style,
}: MenuBarProps): JSX.Element {
  return (
    <div className={css.menuBar} style={style}>
      {items.map(({ icon: Icon, label }, index) => {
        const classNames = [
          css.menuItem,
          label ? css.menuItemLabeled : undefined,
          index === activeIndex ? css.menuItemActive : undefined,
        ]
          .filter(Boolean)
          .join(" ")
        return (
          <span key={index} className={classNames}>
            <Icon strokeWidth={1.75} className={css.menuIcon} />
            {label}
          </span>
        )
      })}
    </div>
  )
}

/** Mouse pointer drawn over the scene. */
export function Cursor({ style }: { style: CSSProperties }): JSX.Element {
  return (
    <svg
      className={css.cursor}
      style={style}
      width="34"
      height="42"
      viewBox="0 0 34 42"
      fill="none"
    >
      <path
        d="M3 2.5 L3 33 L11 25.5 L16.5 38.5 L22 36 L16.8 23.5 L28 23.5 Z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface TooltipProps {
  icon: LucideIcon
  children: ReactNode
  style: CSSProperties
}

/** Blue speech bubble explaining what the hovered command does. */
export function Tooltip({
  icon: Icon,
  children,
  style,
}: TooltipProps): JSX.Element {
  return (
    <div className={css.tooltip} style={style}>
      <span className={css.tooltipIcon}>
        <Icon size={22} strokeWidth={2.6} />
      </span>
      <p className={css.tooltipTitle}>{children}</p>
    </div>
  )
}
