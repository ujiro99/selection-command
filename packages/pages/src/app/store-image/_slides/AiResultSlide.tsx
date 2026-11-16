import { Sparkle } from "lucide-react"

import { Accent, Browser, Canvas, Headline, Sub } from "../_components/parts"
import s from "./slides.module.css"

/** 3 Value delivery: the AI answer the user gets in one click. */
export function AiResultSlide(): JSX.Element {
  return (
    <Canvas background="#f1eee8">
      <Headline size={56} style={{ top: 54, left: 80 }}>
        長い記事も、<Accent>AIで3行に。</Accent>
      </Headline>
      <Sub color="#3d4a5c" style={{ top: 138, left: 80 }}>
        選んだ文章を、いつものプロンプトでChatGPT・Gemini・Claudeへ。
      </Sub>

      {/* AI service opened with the saved prompt and the selected text */}
      <Browser
        url="gemini.google.com"
        style={{ top: 236, left: 80, width: 1120, height: 620 }}
      >
        <div className={s.chat} style={{ top: 84, left: 60, right: 60 }}>
          <span className={s.promptTag}>
            <Sparkle size={18} strokeWidth={2.6} />
            プロンプト「3行で要約」を実行
          </span>
          <div className={s.userBubble}>
            次の文章を3行で要約して：
            <span className={s.quote}>
              「生成AIの導入で、資料作成や情報収集にかかる時間は…」
            </span>
          </div>
          <div className={s.answer}>
            <Sparkle size={30} strokeWidth={2.2} className={s.answerIcon} />
            <ul>
              <li>資料作成や情報収集の時間が大幅に短くなった</li>
              <li>ただし、出力が正しいかの確認は欠かせない</li>
              <li>確認の手順まで含めて導入するのが大切</li>
            </ul>
          </div>
        </div>
      </Browser>
    </Canvas>
  )
}
