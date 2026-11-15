import { AppWindow, Keyboard, Move, PanelRight, Timer } from "lucide-react"

import {
  BrowserMock,
  Cursor,
  StoreSlide,
  type Chip,
} from "../_components/StoreSlide"
import css from "../_components/store.module.css"
import s from "./slides.module.css"

// Startup methods and display modes, as offered in the extension's settings
const CHIPS: Chip[] = [
  { label: "ドラッグ", icon: Move },
  { label: "長押し", icon: Timer },
  { label: "クリック + キー", icon: Keyboard },
  { label: "ポップアップ表示", icon: AppWindow },
  { label: "サイドパネル表示", icon: PanelRight },
]

/** 4: Link preview. Peek at a link in a popup window without a new tab. */
export function LinkPreviewSlide(): JSX.Element {
  return (
    <StoreSlide
      eyebrow="リンクプレビュー"
      headline={["タブを増やさず、", "リンク先をのぞき見。"]}
      lead={
        <>
          リンクをドラッグするだけで、
          <br />
          ポップアップでさっと確認。
        </>
      }
      chipsHeading="開き方・表示方法を選べます"
      chips={CHIPS}
    >
      <BrowserMock url="example.com / article">
        <div className={css.article}>
          <p className={css.articleLabel}>ARTICLE · TECH</p>
          <p className={css.articleTitle}>仕事の進め方が変わる3つの理由</p>
          <div className={css.line} style={{ width: 548 }} />
          <p className={css.articleText}>
            具体的な使い方は、
            <span className={s.link}>生成AI活用ガイド</span>
            へ。
          </p>
          <div className={css.line} style={{ width: 548 }} />
          <div className={css.line} style={{ width: 470 }} />
        </div>
      </BrowserMock>

      <Cursor style={{ top: 262, left: 418 }} />

      <BrowserMock
        url="example.com / guide"
        floating
        style={{ top: 310, left: 50, width: 450, height: 236 }}
      >
        <div className={s.preview}>
          <p className={css.articleLabel}>GUIDE</p>
          <p className={s.previewTitle}>生成AI活用ガイド</p>
          <div className={s.previewImage} />
          <div className={s.previewLine} style={{ width: "92%" }} />
        </div>
      </BrowserMock>

      <span className={s.badge} style={{ top: 520, left: 290 }}>
        <AppWindow size={18} strokeWidth={2.4} />
        ドラッグでプレビュー
      </span>
    </StoreSlide>
  )
}
