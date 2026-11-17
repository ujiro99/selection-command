import {
  Accent,
  Browser,
  Canvas,
  Cursor,
  Fit,
  Headline,
  Lines,
  Sub,
} from "../_components/parts"
import type { SlideProps } from "../_components/i18n"
import s from "./slides.module.css"

/**
 * 5 Link preview: peek at a link in a popup window, no new tab. The gesture
 * that opens it is configurable, so the slide does not name one.
 */
export function LinkPreviewSlide({ t, lang }: SlideProps): JSX.Element {
  const c = t.linkPreview
  return (
    <Canvas lang={lang} background="#ffffff">
      {/* Split composition: copy on a tinted panel, UI on white */}
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: 540,
          background: "#e8f0fd",
        }}
      />
      <Headline size={52} maxWidth={430} style={{ top: 220, left: 70 }}>
        {c.headline}
        <br />
        <Accent>{c.accent}</Accent>
      </Headline>
      <Sub color="#2b394d" maxWidth={430} style={{ top: 390, left: 70 }}>
        <Lines lines={c.sub} />
      </Sub>

      <Browser
        url="example.com / article"
        style={{ top: 40, left: 600, width: 720, height: 420 }}
      >
        <p className={s.pageTitle} style={{ top: 96, left: 44 }}>
          <Fit maxWidth={580}>{t.hero.pageTitle}</Fit>
        </p>
        <div className={s.line} style={{ top: 156, left: 44, width: 560 }} />
        <p className={s.pageText} style={{ top: 186, left: 44, fontSize: 26 }}>
          <Fit maxWidth={580}>
            <span className={s.link}>{c.link}</span>
            {c.linkAfter}
          </Fit>
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
          <p className={s.previewTitle}>{c.link}</p>
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
