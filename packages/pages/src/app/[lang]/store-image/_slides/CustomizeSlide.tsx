import { Download, Folder, GripVertical, Plus } from "lucide-react"

import {
  Accent,
  Browser,
  Canvas,
  Headline,
  Lines,
  SCREENSHOTS,
  Screenshot,
  Sub,
  storeCss,
  Tooltip,
} from "../_components/parts"
import type { SlideProps } from "../_components/i18n"
import s from "./slides.module.css"

// Command list in the settings screenshot, from the add buttons down to the
// end of the Media folder: Google, AI, the Search folder and the Media
// folder. Japanese uses the Japanese screenshot, the other languages the
// English one, whose folders hold different commands, so the Media row
// (where the reorder tooltip points) sits higher.
const SETTINGS = {
  ja: {
    shot: SCREENSHOTS.settings,
    crop: { x: 625, y: 320, width: 1215, height: 1120 },
    reorderTop: 514,
  },
  en: {
    shot: SCREENSHOTS.settingsEn,
    crop: { x: 681, y: 320, width: 1215, height: 1120 },
    reorderTop: 465,
  },
} as const
const LIST_SCALE = 0.44

// Hub list page: logo, filters and the first shared commands with their
// download buttons
const HUB_LIST = { x: 0, y: 0, width: 1800, height: 1100 }
const HUB_SCALE = 0.3

/**
 * 4 Power feature: users add, remove, group and reorder commands, and can
 * find more in the Hub.
 */
export function CustomizeSlide({ t, lang }: SlideProps): JSX.Element {
  const c = t.customize
  const settings = lang === "ja" ? SETTINGS.ja : SETTINGS.en
  return (
    <Canvas lang={lang} background="#1747c4">
      {/* The real settings page, cropped to its command list */}
      <div
        className={`${s.card} ${storeCss.float}`}
        style={{ top: 110, left: 60, width: 560, height: 600 }}
      >
        <p className={s.cardHeader}>{c.cardHeader}</p>
        <Screenshot
          shot={settings.shot}
          crop={settings.crop}
          scale={LIST_SCALE}
          style={{ top: 60, left: 12 }}
        />
      </div>

      {/* Tooltips on what the list can do, placed in the empty part of each
          row so the commands and folders stay visible */}
      <Tooltip
        compact
        icon={Plus}
        arrow={{ side: "right" }}
        style={{ top: 164, right: 1280 - 396 }}
      >
        {c.add}
      </Tooltip>
      <Tooltip
        compact
        icon={Folder}
        arrow={{ side: "left" }}
        style={{ top: 313, left: 202 }}
      >
        {c.folder}
      </Tooltip>
      <Tooltip
        compact
        icon={GripVertical}
        arrow={{ side: "left" }}
        style={{ top: settings.reorderTop, left: 196 }}
      >
        {c.reorder}
      </Tooltip>

      <Headline
        size={52}
        color="#fff"
        maxWidth={560}
        style={{ top: 70, left: 690 }}
      >
        {c.headline}
        <br />
        <Accent onDark>{c.accent}</Accent>
      </Headline>
      <Sub color="#dbe6ff" maxWidth={560} style={{ top: 236, left: 690 }}>
        <Lines lines={c.sub} />
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
        compact
        icon={Download}
        arrow={{ side: "top", offset: 34, fromEnd: true }}
        style={{ top: 590, right: 80 }}
      >
        {c.hub}
      </Tooltip>
    </Canvas>
  )
}
