import {
  Copy,
  CornerDownLeft,
  Keyboard,
  MousePointerClick,
  Palette,
  PanelRight,
  Play,
  Type,
} from "lucide-react"

import { BrowserMock, StoreSlide, type Chip } from "../_components/StoreSlide"
import css from "../_components/store.module.css"
import s from "./slides.module.css"

// Other command types offered by the extension
const CHIPS: Chip[] = [
  { label: "テキストコピー", icon: Copy },
  { label: "スタイル取得", icon: Palette },
  { label: "サイドパネルで開く", icon: PanelRight },
  { label: "ショートカットキー", icon: Keyboard },
]

/** 5: Page action. Record clicks and typing, replay with the selection. */
export function PageActionSlide(): JSX.Element {
  return (
    <StoreSlide
      eyebrow="ページアクション"
      headline={["いつもの操作も、", "ワンクリックで再現。"]}
      lead={
        <>
          クリックや入力を記録して、
          <br />
          選択したテキストで自動実行。
        </>
      }
      chipsHeading="ほかにも便利なコマンド"
      chips={CHIPS}
    >
      <BrowserMock url="example.com / search">
        <div className={css.article}>
          <p className={css.articleLabel}>SITE SEARCH</p>
          <p className={css.articleTitle}>サイト内検索</p>
          <div className={s.searchForm}>
            <span className={s.searchBox}>
              生成AI
              <i className={s.caret} />
            </span>
            <span className={s.searchButton}>検索</span>
          </div>
        </div>
      </BrowserMock>

      {/* Recorded steps of the page action */}
      <div className={s.panel} style={{ top: 280, left: 70, width: 450 }}>
        <div className={s.panelHeader}>
          ページアクション
          <span className={s.runButton}>
            <Play size={14} strokeWidth={2.6} fill="currentColor" />
            実行
          </span>
        </div>
        <ol className={s.steps}>
          <li className={s.step}>
            <span className={s.stepNo}>1</span>
            <MousePointerClick size={18} className={s.stepIcon} />
            <span className={s.stepAction}>クリック</span>
            <span className={s.stepTarget}>検索ボックス</span>
          </li>
          <li className={s.step}>
            <span className={s.stepNo}>2</span>
            <Type size={18} className={s.stepIcon} />
            <span className={s.stepAction}>入力</span>
            <span className={s.variable}>選択テキスト</span>
          </li>
          <li className={s.step}>
            <span className={s.stepNo}>3</span>
            <CornerDownLeft size={18} className={s.stepIcon} />
            <span className={s.stepAction}>キー入力</span>
            <span className={s.kbd}>Enter</span>
          </li>
        </ol>
      </div>
    </StoreSlide>
  )
}
