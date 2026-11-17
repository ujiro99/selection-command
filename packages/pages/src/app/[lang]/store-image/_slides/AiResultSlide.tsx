import { Sparkle, X } from "lucide-react"

import {
  Accent,
  Browser,
  Canvas,
  Cursor,
  Fit,
  Lines,
  Headline,
  POPUP_MENU,
  SCREENSHOTS,
  Screenshot,
  Selected,
  Sub,
  storeCss,
} from "../_components/parts"
import type { SlideProps } from "../_components/i18n"
import s from "./slides.module.css"

const BROWSER_TOP = 220
const BROWSER_LEFT = 80
// The side panel takes the right part of the browser window
const PANEL_LEFT = 680

const MENU_SCALE = 0.8
const MENU_TOP = 548
const MENU_LEFT = 116
// The ChatGPT icon, next to Google in the popup menu screenshot
const AI_ICON = { x: 148, y: 50 }
const CURSOR_TOP = MENU_TOP + AI_ICON.y * MENU_SCALE + 6
const CURSOR_LEFT = MENU_LEFT + AI_ICON.x * MENU_SCALE + 8

// ChatGPT icon in the settings screenshot
const CHATGPT_ICON = { x: 700, y: 558, width: 56, height: 56 }

/**
 * 3 AI prompt: one click on the selected text runs a saved prompt, and the
 * answer opens in the side panel next to the page.
 */
export function AiResultSlide({ t, lang }: SlideProps): JSX.Element {
  const c = t.ai
  return (
    <Canvas lang={lang} background="#f1eee8">
      <Headline size={56} maxWidth={1120} style={{ top: 50, left: 80 }}>
        {c.headline}
        <Accent>{c.accent}</Accent>
      </Headline>
      <Sub color="#3d4a5c" maxWidth={1120} style={{ top: 134, left: 80 }}>
        {c.sub}
      </Sub>

      {/* Scene: browser, popup menu, arrow and cursor tilted together */}
      <div
        className={s.tilt}
        style={{ transformOrigin: `${BROWSER_LEFT}px ${BROWSER_TOP}px` }}
      >
        <Browser
          url="example.com / article"
          style={{
            top: BROWSER_TOP,
            left: BROWSER_LEFT,
            width: 1120,
            height: 640,
          }}
        >
          {/* The page: a selected paragraph */}
          <p className={s.pageTitle} style={{ top: 92, left: 44 }}>
            <Fit maxWidth={600}>{c.pageTitle}</Fit>
          </p>
          <p
            className={s.pageText}
            style={{ top: 152, left: 40, fontSize: 25, lineHeight: 1.95 }}
          >
            <Fit maxWidth={600}>
              <Selected>
                <Lines lines={c.paragraph} />
              </Selected>
            </Fit>
          </p>
          <div className={s.line} style={{ top: 460, left: 44, width: 560 }} />
          <div className={s.line} style={{ top: 492, left: 44, width: 480 }} />

          {/* The side panel with the AI answer */}
          <div className={s.sidePanel} style={{ left: PANEL_LEFT }}>
            <div className={s.sidePanelHeader}>
              <Screenshot
                shot={SCREENSHOTS.settings}
                crop={CHATGPT_ICON}
                scale={26 / CHATGPT_ICON.width}
                style={{ position: "static" }}
              />
              ChatGPT
              <X size={20} className={s.sidePanelClose} />
            </div>
            <div className={s.sideChat}>
              <span className={s.promptTag}>
                <Sparkle size={16} strokeWidth={2.6} />
                {c.promptTag}
              </span>
              <div className={s.userBubble}>
                {c.request}
                <span className={s.quote}>{c.quote}</span>
              </div>
              <div className={s.answer}>
                <Sparkle size={24} strokeWidth={2.2} className={s.answerIcon} />
                <ul>
                  {c.answer.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
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

        {/* From the clicked command to the side panel */}
        <svg
          className={s.dragPath}
          style={{ top: 560, left: 270 }}
          width="480"
          height="150"
        >
          <path
            d="M10 110 C 160 160, 360 130, 470 30"
            fill="none"
            stroke="#2468e6"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M444 34 L 471 29 L 468 56"
            fill="none"
            stroke="#2468e6"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <Cursor scale={1.2} style={{ top: CURSOR_TOP, left: CURSOR_LEFT }} />
      </div>
    </Canvas>
  )
}
