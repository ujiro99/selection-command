import {
  Accent,
  Browser,
  Canvas,
  Cursor,
  Headline,
  Sub,
} from "../_components/parts"
import s from "./slides.module.css"

/**
 * 5 Link preview: peek at a link in a popup window, no new tab. The gesture
 * that opens it is configurable, so the slide does not name one.
 */
export function LinkPreviewSlide(): JSX.Element {
  return (
    <Canvas background="#ffffff">
      {/* Split composition: copy on a tinted panel, UI on white */}
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: 540,
          background: "#e8f0fd",
        }}
      />
      <Headline size={52} style={{ top: 220, left: 70 }}>
        タブを増やさず、
        <br />
        <Accent>リンク先を確認。</Accent>
      </Headline>
      <Sub color="#2b394d" style={{ top: 390, left: 70 }}>
        ポップアップでさっと表示。
        <br />
        元のページに戻るだけで、
        <br />
        自動で閉じます。
      </Sub>

      <Browser
        url="example.com / article"
        style={{ top: 40, left: 600, width: 720, height: 420 }}
      >
        <p className={s.pageTitle} style={{ top: 96, left: 44 }}>
          仕事の進め方が変わる3つの理由
        </p>
        <div className={s.line} style={{ top: 156, left: 44, width: 560 }} />
        <p className={s.pageText} style={{ top: 186, left: 44, fontSize: 26 }}>
          <span className={s.link}>生成AI活用ガイド</span>
          で、具体的な使い方を紹介。
        </p>
        <div className={s.line} style={{ top: 268, left: 44, width: 560 }} />
        <div className={s.line} style={{ top: 298, left: 44, width: 480 }} />
      </Browser>

      {/* From the link to the popup window */}
      <svg
        className={s.dragPath}
        style={{ top: 300, left: 790 }}
        width="200"
        height="150"
      >
        <path
          d="M25 5 Q 160 15, 160 132"
          fill="none"
          stroke="#2468e6"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M146 118 L 160 136 L 174 118"
          fill="none"
          stroke="#2468e6"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <Browser
        url="example.com / guide"
        style={{ top: 440, left: 720, width: 540, height: 340 }}
      >
        <div className={s.preview}>
          <p className={s.previewTitle}>生成AI活用ガイド</p>
          <div className={s.previewImage} />
          <div className={s.previewLine} style={{ width: "92%" }} />
          <div className={s.previewLine} style={{ width: "70%" }} />
        </div>
      </Browser>
      {/* On the link. Drawn last so it stays above the preview window. */}
      <Cursor scale={1.2} style={{ top: 256, left: 780 }} />
    </Canvas>
  )
}
