import { Download, Folder, GripVertical, Plus } from "lucide-react"

import {
  Browser,
  Canvas,
  Headline,
  SCREENSHOTS,
  Screenshot,
  Sub,
  storeCss,
  Tooltip,
} from "../_components/parts"
import s from "./slides.module.css"

// Command list in the settings screenshot, from the add buttons down to
// Netflix: Google, AI, the Search folder and the Media folder.
const COMMAND_LIST = { x: 625, y: 320, width: 1215, height: 1120 }
const LIST_SCALE = 0.44

// Hub list page: logo, filters and the first shared commands with their
// download buttons
const HUB_LIST = { x: 0, y: 0, width: 1800, height: 1100 }
const HUB_SCALE = 0.3

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

      {/* Tooltips on what the list can do. Each arrow tip is 38px right of
          the tooltip's left and 8px above its top. */}
      <Tooltip navy icon={Plus} style={{ top: 228, left: 382 }}>
        自分で追加・削除
      </Tooltip>
      <Tooltip navy icon={Folder} style={{ top: 362, left: 122 }}>
        フォルダで整理
      </Tooltip>
      <Tooltip navy icon={GripVertical} style={{ top: 562, left: 52 }}>
        ドラッグで並べ替え
      </Tooltip>

      <Headline size={52} color="#fff" style={{ top: 70, left: 690 }}>
        よく使うサービスを、
        <br />
        <span style={{ color: "#bcd3ff" }}>自分専用メニューに。</span>
      </Headline>
      <Sub color="#dbe6ff" style={{ top: 236, left: 690 }}>
        使う分だけ、好きな順に。
        <br />
        Hubで、コマンドの発見・共有も可能。
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
      {/* Points at the download button of "Page Summary by AI" */}
      <Tooltip
        navy
        icon={Download}
        arrowLeft={182}
        style={{ top: 590, left: 968 }}
      >
        Hubから追加
      </Tooltip>
    </Canvas>
  )
}
