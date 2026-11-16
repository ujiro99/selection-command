import {
  Accent,
  Browser,
  Canvas,
  Cursor,
  Headline,
  Sub,
} from "../_components/parts"
import s from "./slides.module.css"

/** 5 Link preview: peek at a link in a popup window, no new tab. */
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
      <Headline size={52} style={{ top: 250, left: 70 }}>
        タブを増やさず、
        <br />
        <Accent>リンクを確認。</Accent>
      </Headline>
      <Sub color="#2b394d" style={{ top: 420, left: 70 }}>
        リンクをドラッグするだけで、
        <br />
        ポップアップにさっと表示。
      </Sub>

      <Browser
        url="example.com / article"
        style={{ top: 80, left: 600, width: 720, height: 420 }}
      >
        <p className={s.pageTitle} style={{ top: 96, left: 44 }}>
          仕事の進め方が変わる3つの理由
        </p>
        <div className={s.line} style={{ top: 156, left: 44, width: 560 }} />
        <p className={s.pageText} style={{ top: 186, left: 44, fontSize: 26 }}>
          具体的な使い方は、<span className={s.link}>生成AI活用ガイド</span>へ。
        </p>
        <div className={s.line} style={{ top: 268, left: 44, width: 560 }} />
        <div className={s.line} style={{ top: 298, left: 44, width: 480 }} />
      </Browser>

      {/* Drag gesture from the link down to the preview window */}
      <svg
        className={s.dragPath}
        style={{ top: 312, left: 940 }}
        width="60"
        height="110"
      >
        <path
          d="M4 4 C 6 40, 20 70, 42 90"
          fill="none"
          stroke="#2468e6"
          strokeWidth="4"
          strokeDasharray="8 9"
          strokeLinecap="round"
        />
      </svg>

      <Browser
        url="example.com / guide"
        style={{ top: 410, left: 760, width: 460, height: 340 }}
      >
        <div className={s.preview}>
          <p className={s.previewTitle}>生成AI活用ガイド</p>
          <div className={s.previewImage} />
          <div className={s.previewLine} style={{ width: "92%" }} />
          <div className={s.previewLine} style={{ width: "70%" }} />
        </div>
      </Browser>
      {/* Drawn last so it stays above the preview window */}
      <Cursor scale={1.2} style={{ top: 396, left: 980 }} />
    </Canvas>
  )
}
