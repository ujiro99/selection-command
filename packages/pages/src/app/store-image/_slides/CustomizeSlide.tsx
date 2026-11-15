import {
  ArrowLeftRight,
  CalendarDays,
  EllipsisVertical,
  FileSpreadsheet,
  Folder,
  Keyboard,
  Languages,
  Mail,
  Plus,
  Search,
  Sparkle,
  Users,
} from "lucide-react"

import {
  BrowserMock,
  Cursor,
  MenuBar,
  StoreSlide,
  type Chip,
} from "../_components/StoreSlide"
import css from "../_components/store.module.css"

const CHIPS: Chip[] = [
  { label: "何個でも追加", icon: Plus },
  { label: "フォルダ分け", icon: Folder },
  { label: "並べ替え", icon: ArrowLeftRight },
  { label: "ショートカットキー", icon: Keyboard },
  { label: "みんなのコマンドを取得", icon: Users },
]

const MENU = [
  { icon: Search },
  { icon: Sparkle },
  { icon: Languages },
  { icon: Folder, label: "仕事" },
  { icon: EllipsisVertical },
]

// Commands inside the "仕事" folder
const SUB_MENU = [
  { icon: Mail },
  { icon: CalendarDays },
  { icon: FileSpreadsheet },
]

/** 3: Customize. Build your own menu with folders and shared commands. */
export function CustomizeSlide(): JSX.Element {
  return (
    <StoreSlide
      eyebrow="カスタマイズ"
      headline={["よく使うサービスを、", "自分だけのメニューに。"]}
      lead={
        <>
          検索エンジンもAIも、何個でも追加。
          <br />
          並び順もフォルダも自由自在。
        </>
      }
      chipsHeading="使いやすく整えられます"
      chips={CHIPS}
      note="Selection Command Hub で、他の人が共有したコマンドも追加できます"
    >
      <BrowserMock url="example.com / article">
        <div className={css.article}>
          <p className={css.articleLabel}>ARTICLE · TECH</p>
          <p className={css.articleTitle}>仕事の進め方が変わる3つの理由</p>
          <div className={css.line} style={{ width: 548 }} />
          <p className={css.articleText}>
            来週の定例で共有したいのは、
            <br />
            <mark className={css.selected}>生成AIの活用事例</mark>について。
          </p>
        </div>
      </BrowserMock>

      <MenuBar items={MENU} activeIndex={3} style={{ top: 350, left: 40 }} />
      <MenuBar items={SUB_MENU} style={{ top: 442, left: 236 }} />
      <Cursor style={{ top: 400, left: 300 }} />
    </StoreSlide>
  )
}
