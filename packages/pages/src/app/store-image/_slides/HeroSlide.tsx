import {
  EllipsisVertical,
  Eye,
  FileText,
  Image as ImageIcon,
  Languages,
  MessageCircle,
  MonitorPlay,
  MousePointerClick,
  Search,
  ShoppingBag,
  Sparkle,
} from "lucide-react"

import {
  BrowserMock,
  Cursor,
  MenuBar,
  StoreSlide,
  Tooltip,
  type Chip,
} from "../_components/StoreSlide"
import css from "../_components/store.module.css"

// Use cases listed under the lead copy, based on popular commands on
// selection-command.com.
const CHIPS: Chip[] = [
  { label: "検索", icon: Search },
  { label: "AIに聞く", icon: Sparkle },
  { label: "翻訳", icon: Languages },
  { label: "要約", icon: FileText },
  { label: "画像検索", icon: ImageIcon },
  { label: "動画検索", icon: MonitorPlay },
  { label: "買い物", icon: ShoppingBag },
  { label: "SNS検索", icon: MessageCircle },
  { label: "リンクプレビュー", icon: Eye },
  { label: "自動操作", icon: MousePointerClick },
]

// The mock menu bar shows the first chips' commands in the same order, so
// the icons on both sides match.
const MENU = [
  ...CHIPS.slice(0, 6).map(({ icon }) => ({ icon })),
  { icon: EllipsisVertical },
]

/** 1: Overview. Select a word, pick a command, search right away. */
export function HeroSlide(): JSX.Element {
  return (
    <StoreSlide
      eyebrow="無料のChrome拡張機能"
      headline={["気になる言葉から、", "検索もAIもすぐ実行。"]}
      lead={
        <>
          コピーして、タブを開いて、貼り付ける。
          <br />
          その手間をなくそう。
        </>
      }
      chipsHeading="好きなメニューを登録できます"
      chips={CHIPS}
    >
      <BrowserMock url="example.com / article">
        <div className={css.article}>
          <p className={css.articleLabel}>ARTICLE · TECH</p>
          <p className={css.articleTitle}>仕事の進め方が変わる3つの理由</p>
          <div className={css.line} style={{ width: 548 }} />
          <p className={css.articleText}>
            仕事の進め方を大きく変えるテクノロジーが、
            <br />
            最近よく耳にする<mark className={css.selected}>生成AI</mark>だ。
          </p>
          <div className={css.line} style={{ width: 548 }} />
          <div className={css.line} style={{ width: 470 }} />
        </div>
      </BrowserMock>

      <MenuBar items={MENU} activeIndex={0} style={{ top: 350, left: 62 }} />
      <Cursor style={{ top: 408, left: 124 }} />
      <Tooltip icon={Search} style={{ top: 468, left: 108 }}>
        選択した言葉を
        <br />
        ワンクリックで検索
      </Tooltip>
    </StoreSlide>
  )
}
