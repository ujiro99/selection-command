import { Download, Folder, GripVertical, Plus } from "lucide-react"

import {
  Browser,
  Canvas,
  Headline,
  SCREENSHOTS,
  Screenshot,
  Sub,
  storeCss,
} from "../_components/parts"
import s from "./slides.module.css"

// Command list in the settings screenshot, from the add buttons down to
// Netflix: Google, AI, the Search folder and the Media folder.
const COMMAND_LIST = { x: 625, y: 320, width: 1215, height: 1120 }
const LIST_SCALE = 0.44

// Hub list page: logo, filters and the first shared commands
const HUB_LIST = { x: 0, y: 0, width: 1500, height: 1040 }
const HUB_SCALE = 0.36

/**
 * 4 Power feature: users add, remove, group and reorder commands, and can
 * find more in the Hub.
 */
export function CustomizeSlide(): JSX.Element {
  return (
    <Canvas background="#1747c4">
      {/* The real settings page, cropped to its command list */}
      <div
        className={`${s.card} ${storeCss.float}`}
        style={{ top: 110, left: 60, width: 560, height: 600 }}
      >
        <p className={s.cardHeader}>コマンドの設定</p>
        <Screenshot
          shot={SCREENSHOTS.settings}
          crop={COMMAND_LIST}
          scale={LIST_SCALE}
          style={{ top: 60, left: 12 }}
        />
      </div>

      {/* Callouts on what the list can do */}
      <p className={s.callout} style={{ top: 124, left: 388 }}>
        <Plus size={20} strokeWidth={2.8} />
        自分で追加・削除
      </p>
      <p className={s.callout} style={{ top: 322, left: 290 }}>
        <Folder size={20} strokeWidth={2.6} />
        フォルダで整理
      </p>
      <p className={s.callout} style={{ top: 520, left: 290 }}>
        <GripVertical size={20} strokeWidth={2.6} />
        ドラッグで並べ替え
      </p>

      <Headline size={56} color="#fff" style={{ top: 70, left: 690 }}>
        メニューは、
        <br />
        <span style={{ color: "#bcd3ff" }}>自分好みに。</span>
      </Headline>
      <Sub color="#dbe6ff" style={{ top: 236, left: 690 }}>
        使う分だけ、好きな順に。
        <br />
        Hubで、みんなのコマンドも。
      </Sub>

      {/* Selection Command Hub, where shared commands are found */}
      <Browser
        url="selection-command.com"
        style={{ top: 380, left: 690, width: 540, height: 380 }}
      >
        <Screenshot
          shot={SCREENSHOTS.hub}
          crop={HUB_LIST}
          scale={HUB_SCALE}
          style={{ top: 52, left: 0 }}
        />
      </Browser>
      <p
        className={`${s.callout} ${s.calloutLight}`}
        style={{ top: 704, left: 520 }}
      >
        <Download size={20} strokeWidth={2.8} />
        Hubから追加
      </p>
    </Canvas>
  )
}
