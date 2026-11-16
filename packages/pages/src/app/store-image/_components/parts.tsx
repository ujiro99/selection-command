import type { CSSProperties, ReactNode } from "react"

import { Logo } from "@/components/Logo"

import css from "./store.module.css"

/** Fixed 1280x800 canvas of one store image. */
export function Canvas({
  background,
  children,
}: {
  background: string
  children: ReactNode
}): JSX.Element {
  return (
    <div className={css.canvas} style={{ background }} data-store-slide="">
      {children}
    </div>
  )
}

/** Extension icon and wordmark. */
export function Brand({ style }: { style: CSSProperties }): JSX.Element {
  return (
    <div className={css.brand} style={style}>
      {/* Plain img: next/image would point at /_next/image, which does not
          exist in the static export. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/store-image/icon128.png"
        alt=""
        width={48}
        height={48}
        className={css.brandIcon}
      />
      <Logo variant="lg" hub={false} />
    </div>
  )
}

/** Headline. Wrap the accented part in <Accent>. */
export function Headline({
  size,
  color,
  style,
  children,
}: {
  size: number
  color?: string
  style: CSSProperties
  children: ReactNode
}): JSX.Element {
  return (
    <h1 className={css.headline} style={{ fontSize: size, color, ...style }}>
      {children}
    </h1>
  )
}

export function Accent({ children }: { children: ReactNode }): JSX.Element {
  return <span className={css.accent}>{children}</span>
}

export function Sub({
  color,
  style,
  children,
}: {
  color: string
  style: CSSProperties
  children: ReactNode
}): JSX.Element {
  return (
    <p className={css.sub} style={{ color, ...style }}>
      {children}
    </p>
  )
}

/** Browser window with an address bar. */
export function Browser({
  url,
  style,
  children,
}: {
  url: string
  style: CSSProperties
  children: ReactNode
}): JSX.Element {
  return (
    <div className={`${css.browser} ${css.float}`} style={style}>
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

/** Highlight of selected text. */
export function Selected({ children }: { children: ReactNode }): JSX.Element {
  return <mark className={css.selected}>{children}</mark>
}

/** Mouse pointer. `style` sets its top-left (the tip is at +3, +3). */
export function Cursor({
  style,
  scale = 1,
}: {
  style: CSSProperties
  scale?: number
}): JSX.Element {
  return (
    <svg
      className={css.cursor}
      style={style}
      width={34 * scale}
      height={42 * scale}
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

/** Real screenshots of the extension, with their natural pixel width. */
export const SCREENSHOTS = {
  popupMenu: { src: "/store-image/screenshots/popup-menu.png", width: 746 },
  settings: { src: "/store-image/screenshots/settings.png", width: 2569 },
} as const

type Crop = { x: number; y: number; width: number; height: number }

/**
 * A region of a real screenshot, scaled. `crop` is in the screenshot's own
 * pixels. The screenshot itself is shown as is, without restyling.
 */
export function Screenshot({
  shot,
  crop,
  scale,
  style,
  className,
}: {
  shot: (typeof SCREENSHOTS)[keyof typeof SCREENSHOTS]
  crop: Crop
  scale: number
  style: CSSProperties
  className?: string
}): JSX.Element {
  return (
    <div
      className={[css.shot, className].filter(Boolean).join(" ")}
      style={{
        width: crop.width * scale,
        height: crop.height * scale,
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shot.src}
        alt=""
        width={shot.width * scale}
        style={{ marginLeft: -crop.x * scale, marginTop: -crop.y * scale }}
      />
    </div>
  )
}

export { css as storeCss }
