import { Search } from "lucide-react"

import {
  Accent,
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
} from "../_components/parts"
import s from "./slides.module.css"

const ICON = POPUP_MENU.hoveredIcon
const MENU_SCALE = 0.8
const MENU_TOP = 500
const MENU_LEFT = 104
const CURSOR_TOP = MENU_TOP + ICON.y * MENU_SCALE + 16
const CURSOR_LEFT = MENU_LEFT + ICON.x * MENU_SCALE + 16

// Service icons in the real settings screenshot: the center and size of
// each icon's visible bounds, measured from its pixels, plus a 2px margin.
const ENGINE_ICONS = [
  { name: "Google", cx: 731.5, cy: 473.5, size: 44 },
  { name: "Amazon", cx: 795.5, cy: 929.5, size: 58 },
  { name: "Yahoo! Japan", cx: 795.5, cy: 1043, size: 58 },
  { name: "YouTube", cx: 795.5, cy: 1271.5, size: 58 },
  { name: "Netflix", cx: 795.5, cy: 1385.5, size: 58 },
  { name: "ChatGPT", cx: 731.5, cy: 587.5, size: 50 },
  { name: "Gemini", cx: 795.5, cy: 1613.5, size: 54 },
]
// Rendered size of the longer side of each icon
const ICON_SIZE = 34
const CHIP = 60
const CHIP_GAP = 14
const CHIP_COUNT = ENGINE_ICONS.length + 1
const CHIPS_LEFT =
  (1280 - (CHIP * CHIP_COUNT + CHIP_GAP * (CHIP_COUNT - 1))) / 2

/**
 * 2 How it works: select, pick a command, and the result opens in a popup
 * window. Any search engine can be added to the menu.
 */
export function TriggerSlide(): JSX.Element {
  return (
    <Canvas background="#0f1b2d">
      <Headline
        size={56}
        color="#fff"
        style={{ top: 48, left: 0, width: 1280, textAlign: "center" }}
      >
        選んでクリック、<Accent onDark>結果はポップアップで。</Accent>
      </Headline>
      <Sub
        color="#b8c4d6"
        style={{ top: 136, left: 0, width: 1280, textAlign: "center" }}
      >
        Google・Amazon・YouTubeなど、いつもの検索エンジンでそのまま検索。
      </Sub>

      {/* Services that can be added as commands */}
      {ENGINE_ICONS.map((icon, i) => (
        <div
          key={icon.name}
          className={s.engineChip}
          style={{ top: 206, left: CHIPS_LEFT + i * (CHIP + CHIP_GAP) }}
        >
          <Screenshot
            shot={SCREENSHOTS.settings}
            crop={{
              x: icon.cx - icon.size / 2,
              y: icon.cy - icon.size / 2,
              width: icon.size,
              height: icon.size,
            }}
            scale={ICON_SIZE / icon.size}
            style={{ position: "static" }}
          />
        </div>
      ))}
      <div
        className={`${s.engineChip} ${s.engineMore}`}
        style={{
          top: 206,
          left: CHIPS_LEFT + ENGINE_ICONS.length * (CHIP + CHIP_GAP),
        }}
      >
        …
      </div>

      {/* The page the user is reading */}
      <Browser
        url="example.com / movie"
        style={{ top: 340, left: 64, width: 740, height: 560 }}
      >
        <p
          className={s.pageText}
          style={{ top: 76, left: 44, fontSize: 30, color: "#556378" }}
        >
          週末は<Selected>インターステラー</Selected>を観たい。
        </p>
        <div className={s.line} style={{ top: 280, left: 44, width: 600 }} />
        <div className={s.line} style={{ top: 312, left: 44, width: 520 }} />
        <div className={s.line} style={{ top: 344, left: 44, width: 580 }} />
      </Browser>

      <Screenshot
        shot={SCREENSHOTS.popupMenu}
        crop={POPUP_MENU.crop}
        scale={MENU_SCALE}
        className={storeCss.shotShadow}
        style={{
          top: MENU_TOP,
          left: MENU_LEFT,
          borderRadius: POPUP_MENU.radius * MENU_SCALE,
        }}
      />

      {/* From the clicked command to the popup window */}
      <svg
        className={s.dragPath}
        style={{ top: 590, left: 170 }}
        width="560"
        height="120"
      >
        <path
          d="M10 20 C 110 110, 350 110, 500 40"
          fill="none"
          stroke="#2468e6"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M480 30 L 506 37 L 494 61"
          fill="none"
          stroke="#2468e6"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* The result, opened in a popup window over the page */}
      <Browser
        url="google.com/search?q=インターステラー"
        style={{ top: 312, left: 712, width: 528, height: 470 }}
      >
        <div className={s.result}>
          <p className={s.searchBox}>
            <Search size={20} strokeWidth={2.6} />
            インターステラー
          </p>
          <p className={s.resultUrl}>youtube.com</p>
          <p className={s.resultTitle}>インターステラー 予告編</p>
          <div className={s.previewLine} style={{ width: "90%" }} />
          <p className={s.resultUrl}>wikipedia.org</p>
          <p className={s.resultTitle}>インターステラー - Wikipedia</p>
          <div className={s.previewLine} style={{ width: "84%" }} />
          <div className={s.previewLine} style={{ width: "60%" }} />
        </div>
      </Browser>

      <Cursor scale={1.2} style={{ top: CURSOR_TOP, left: CURSOR_LEFT }} />
    </Canvas>
  )
}
