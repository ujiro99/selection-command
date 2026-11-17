import { Search } from "lucide-react"

import {
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

// Service icons cropped from the real settings screenshot (56px squares)
const ENGINE_ICONS = [
  { x: 700, y: 444 }, // Google
  { x: 764, y: 899 }, // Amazon
  { x: 764, y: 1013 }, // Yahoo! Japan
  { x: 764, y: 1239 }, // YouTube
  { x: 764, y: 1353 }, // Netflix
  { x: 700, y: 558 }, // ChatGPT
  { x: 764, y: 1581 }, // Gemini
]
const ICON_CROP = 56
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
        選んでクリック、{/* Brighter than the default accent for contrast on navy */}
        <span style={{ color: "#78acff" }}>結果はポップアップで。</span>
      </Headline>
      <Sub
        color="#b8c4d6"
        style={{ top: 136, left: 0, width: 1280, textAlign: "center" }}
      >
        よく使う検索エンジンを、好きなだけメニューに追加できます。
      </Sub>

      {/* Services that can be added as commands */}
      {ENGINE_ICONS.map((icon, i) => (
        <div
          key={`${icon.x}-${icon.y}`}
          className={s.engineChip}
          style={{ top: 206, left: CHIPS_LEFT + i * (CHIP + CHIP_GAP) }}
        >
          <Screenshot
            shot={SCREENSHOTS.settings}
            crop={{ ...icon, width: ICON_CROP, height: ICON_CROP }}
            scale={34 / ICON_CROP}
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
