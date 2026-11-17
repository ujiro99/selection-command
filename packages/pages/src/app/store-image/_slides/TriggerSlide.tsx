import {
  Accent,
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

const POPUP = POPUP_MENU.crop
const ICON = POPUP_MENU.hoveredIcon
const SCALE = 1.24

/** 2 Trigger: selecting text is all it takes to bring up the menu. */
export function TriggerSlide(): JSX.Element {
  const popupLeft = (1280 - POPUP.width * SCALE) / 2
  return (
    <Canvas background="#0f1b2d">
      <Headline
        size={60}
        color="#fff"
        style={{ top: 64, left: 0, width: 1280, textAlign: "center" }}
      >
        選ぶだけで、<Accent>メニューが出る。</Accent>
      </Headline>
      <Sub
        color="#b8c4d6"
        style={{ top: 160, left: 0, width: 1280, textAlign: "center" }}
      >
        テキストを選択すると、その場にコマンドが並びます。
      </Sub>

      <div
        className={s.paper}
        style={{ top: 260, left: 120, width: 1040, height: 600 }}
      />
      <p
        className={s.pageText}
        style={{ top: 312, left: 190, fontSize: 32, color: "#556378" }}
      >
        週末に観る映画、<Selected>インターステラー</Selected>の予告編を探す。
      </p>

      {/* The real popup menu */}
      <Screenshot
        shot={SCREENSHOTS.popupMenu}
        crop={POPUP}
        scale={SCALE}
        className={storeCss.shotShadow}
        style={{
          top: 420,
          left: popupLeft,
          borderRadius: POPUP_MENU.radius * SCALE,
        }}
      />
      <Cursor
        scale={1.3}
        style={{
          top: 420 + ICON.y * SCALE + 8,
          left: popupLeft + ICON.x * SCALE + 10,
        }}
      />
    </Canvas>
  )
}
