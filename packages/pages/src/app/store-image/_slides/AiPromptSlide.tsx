import {
  Building2,
  FileText,
  Languages,
  Lightbulb,
  SearchCheck,
  Sparkle,
} from "lucide-react"

import { BrowserMock, StoreSlide, type Chip } from "../_components/StoreSlide"
import css from "../_components/store.module.css"
import s from "./slides.module.css"

// Typical prompts users register, taken from the existing store image.
const CHIPS: Chip[] = [
  { label: "要約", icon: FileText },
  { label: "翻訳", icon: Languages },
  { label: "わかりやすく解説", icon: Lightbulb },
  { label: "企業・サービス調査", icon: Building2 },
  { label: "SEOレビュー", icon: SearchCheck },
]

/** 2: AI prompt. Send the selected text to an AI with a saved prompt. */
export function AiPromptSlide(): JSX.Element {
  return (
    <StoreSlide
      eyebrow="AIプロンプト"
      headline={["選んだ文章を、", "そのままAIへ。"]}
      lead={
        <>
          要約・翻訳・解説など、よく使う
          <br />
          プロンプトをワンクリックで実行。
        </>
      }
      chipsHeading="よく使うプロンプトを登録できます"
      chips={CHIPS}
      note="対応AI：ChatGPT ・ Gemini ・ Claude ・ Perplexity"
    >
      <BrowserMock url="example.com / article">
        <div className={css.article}>
          <p className={css.articleLabel}>ARTICLE · TECH</p>
          <p className={css.articleTitle}>生成AI、導入の前に知っておくこと</p>
          <p className={s.aiText}>
            <mark className={css.selected}>
              生成AIの導入で、資料作成や情報収集に
              <br />
              かかる時間は大幅に短縮された。一方で、
              <br />
              出力の正確性を確かめる工程も欠かせない。
            </mark>
          </p>
        </div>
      </BrowserMock>

      {/* AI service opened with the saved prompt and the selected text */}
      <BrowserMock
        url="gemini.google.com"
        floating
        style={{ top: 344, left: 96, width: 440 }}
      >
        <div className={s.chat}>
          <span className={s.promptTag}>
            <Sparkle size={13} strokeWidth={2.6} />
            プロンプト「3行で要約」を実行
          </span>
          <div className={s.userBubble}>
            次の文章を3行で要約して：
            <span className={s.quote}>「生成AIの導入で、資料作成や…」</span>
          </div>
          <div className={s.answer}>
            <Sparkle size={18} strokeWidth={2.2} className={s.answerIcon} />
            <ul>
              <li>資料作成や情報収集の時間を短縮</li>
              <li>一方で出力の正確性の確認は必須</li>
              <li>確認の工程まで含めた導入が重要</li>
            </ul>
          </div>
        </div>
      </BrowserMock>
    </StoreSlide>
  )
}
