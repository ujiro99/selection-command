import {
  Canvas,
  Headline,
  SCREENSHOTS,
  Screenshot,
  Sub,
  storeCss,
} from "../_components/parts"
import s from "./slides.module.css"

// Command list in the settings screenshot: Google, AI, the Search folder
// with Google Image / Amazon / Yahoo! Japan, and Media. Edit buttons are
// left out.
const COMMAND_LIST = { x: 640, y: 420, width: 900, height: 795 }

/** 4 Power feature: commands, folders and order are all up to the user. */
export function CustomizeSlide(): JSX.Element {
  return (
    <Canvas background="#1747c4">
      {/* The real settings page, cropped to its command list */}
      <div
        className={`${s.card} ${storeCss.float}`}
        style={{ top: 80, left: 60, width: 660, height: 640 }}
      >
        <p className={s.cardHeader}>コマンドの設定</p>
        <Screenshot
          shot={SCREENSHOTS.settings}
          crop={COMMAND_LIST}
          scale={0.7}
          style={{ top: 60, left: 12 }}
        />
      </div>

      <Headline size={60} color="#fff" style={{ top: 200, left: 790 }}>
        メニューは、
        <br />
        <span style={{ color: "#bcd3ff" }}>自分好みに。</span>
      </Headline>
      <Sub color="#dbe6ff" style={{ top: 390, left: 790 }}>
        検索エンジンもAIも、
        <br />
        好きなだけ追加。
        <br />
        フォルダで整理して、
        <br />
        ドラッグで並べ替え。
      </Sub>
    </Canvas>
  )
}
