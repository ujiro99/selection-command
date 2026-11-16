import {
  Accent,
  Brand,
  Browser,
  Canvas,
  Cursor,
  Headline,
  SCREENSHOTS,
  Screenshot,
  Selected,
  Sub,
} from "../_components/parts"
import s from "./slides.module.css"

const POPUP = { x: 0, y: 0, width: 746, height: 262 }

/** 1 Hero: brand, the core promise, and the real popup in action. */
export function HeroSlide(): JSX.Element {
  return (
    <Canvas background="#f4f7fc">
      <Brand style={{ top: 56, left: 68 }} />

      <p className={s.badge} style={{ top: 186, left: 68 }}>
        <span className={s.badgePill}>無料</span>
        AI連携も追加料金なし
      </p>

      <Headline size={56} style={{ top: 248, left: 68 }}>
        気になる言葉から、
        <br />
        <Accent>検索もAIもすぐ実行。</Accent>
      </Headline>

      <Sub color="#2b394d" style={{ top: 430, left: 68 }}>
        コピーして、タブを開いて、貼り付ける。
        <br />
        その手間をなくそう。
      </Sub>

      <Browser
        url="example.com / article"
        style={{ top: 150, left: 660, width: 660, height: 530 }}
      >
        <p className={s.pageTitle} style={{ top: 100, left: 40 }}>
          仕事の進め方が変わる3つの理由
        </p>
        <div className={s.line} style={{ top: 160, left: 40, width: 540 }} />
        <p className={s.pageText} style={{ top: 196, left: 40, fontSize: 24 }}>
          仕事の進め方を大きく変えるテクノロジーが、
          <br />
          最近よく耳にする<Selected>生成AI</Selected>だ。
        </p>
      </Browser>

      {/* The real popup menu, shown under the selection */}
      <Screenshot
        shot={SCREENSHOTS.popupMenu}
        crop={POPUP}
        scale={0.8}
        style={{ top: 446, left: 664 }}
      />
      <Cursor style={{ top: 540, left: 884 }} />
    </Canvas>
  )
}
