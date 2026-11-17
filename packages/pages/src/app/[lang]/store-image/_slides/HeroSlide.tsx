import { Search } from "lucide-react"

import {
  Accent,
  Brand,
  Fit,
  Lines,
  Browser,
  Canvas,
  Cursor,
  Headline,
  POPUP_MENU,
  SCREENSHOTS,
  Screenshot,
  Selected,
  Sub,
  storeCss,
  Tooltip,
} from "../_components/parts"
import type { SlideProps } from "../_components/i18n"
import s from "./slides.module.css"

const POPUP_SCALE = 0.83
const POPUP_TOP = 446
const POPUP_LEFT = 686
const ICON = POPUP_MENU.hoveredIcon
// Top-left of the cursor, a little below and right of the hovered icon
const CURSOR_TOP = POPUP_TOP + ICON.y * POPUP_SCALE + 16
const CURSOR_LEFT = POPUP_LEFT + ICON.x * POPUP_SCALE + 16

// Soft blue glow from the top right, as in the earlier design
const HERO_BACKGROUND = [
  "radial-gradient(ellipse 640px 420px at 100% 0%, rgb(205 225 252 / 0.85), transparent 70%)",
  "linear-gradient(135deg, #fbfcff 0%, #f5f8fd 55%, #eef3fb 100%)",
].join(", ")

/** 1 Hero: brand, the core promise, and the real popup in action. */
export function HeroSlide({ t, lang }: SlideProps): JSX.Element {
  const c = t.hero
  return (
    <Canvas lang={lang} background={HERO_BACKGROUND}>
      <Brand style={{ top: 56, left: 68 }} />

      {/* Copy block, vertically centered against the browser on the right */}
      <p className={s.badge} style={{ top: lang === "ja" ? 200 : 232, left: 68 }}>
        <span className={s.badgePill}>{c.badge}</span>
        <span style={{ whiteSpace: "pre-line" }}>{c.badgeNote}</span>
      </p>
      <Headline
        size={56}
        maxWidth={560}
        style={{ top: lang === "ja" ? 280 : 312, left: 68 }}
      >
        <Lines lines={c.headline.split("\n")} />
        <br />
        <Accent>
          <Lines lines={c.accent.split("\n")} />
        </Accent>
      </Headline>
      <Sub
        color="#2b394d"
        maxWidth={560}
        style={{ top: lang === "ja" ? 532 : 456, left: 68 }}
      >
        <Lines lines={c.sub} />
      </Sub>

      {/* Scene: browser, popup and cursor tilted together */}
      <div className={s.tilt} style={{ transformOrigin: "660px 140px" }}>
        <Browser
          url="example.com / article"
          style={{ top: 140, left: 660, width: 680, height: 570 }}
        >
          <p className={s.pageTitle} style={{ top: 100, left: 40 }}>
            <Fit maxWidth={530}>{c.pageTitle}</Fit>
          </p>
          <div className={s.line} style={{ top: 160, left: 40, width: 540 }} />
          <p
            className={s.pageText}
            style={{ top: 196, left: 40, fontSize: 24 }}
          >
            <Fit maxWidth={530}>
              {c.pageLine}
              <br />
              {c.pageBefore}
              <Selected>{c.pageSelected}</Selected>
              {c.pageAfter}
            </Fit>
          </p>
        </Browser>

        {/* The real popup menu, shown under the selection */}
        <Screenshot
          shot={SCREENSHOTS.popupMenu}
          crop={POPUP_MENU.crop}
          scale={POPUP_SCALE}
          className={storeCss.shotShadow}
          style={{
            top: POPUP_TOP,
            left: POPUP_LEFT,
            borderRadius: POPUP_MENU.radius * POPUP_SCALE,
          }}
        />
        {/* What the click does: the arrow comes out from under the cursor */}
        <Tooltip
          icon={Search}
          style={{ top: CURSOR_TOP + 70, left: CURSOR_LEFT - 22 }}
        >
          <Lines lines={c.tooltip} />
        </Tooltip>
        <Cursor scale={1.2} style={{ top: CURSOR_TOP, left: CURSOR_LEFT }} />
      </div>
      {"serviceNote" in c && typeof c.serviceNote === "string" && (
        <Sub
          color="#3d4a5c"
          maxWidth={1144}
          style={{ bottom: 36, left: 68, fontSize: 22 }}
        >
          {c.serviceNote}
        </Sub>
      )}
    </Canvas>
  )
}
