"use client"

import { useMemo, useRef, useState } from "react"
import { toPng } from "html-to-image"

import type { LanguageType } from "@/features/locale"

import { getStoreText } from "./_components/i18n"
import { SLIDES } from "./_slides"
import css from "./gallery.module.css"

const WIDTH = 1280
const HEIGHT = 800

/** Render one slide element to PNG and download it. */
async function exportSlide(root: HTMLElement, fileName: string) {
  const node = root.querySelector<HTMLElement>("[data-store-slide]")
  if (!node) return
  // The node is cloned for rendering, so the preview's scale-down
  // transform on its parent does not apply.
  const dataUrl = await toPng(node, {
    width: WIDTH,
    height: HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
  })
  const link = document.createElement("a")
  link.download = fileName
  link.href = dataUrl
  link.click()
}

/**
 * All store images of one language at 50%, with PNG export buttons. Files
 * are named with the language code first, such as ja_01_hero.png.
 */
export function Gallery({ lang }: { lang: LanguageType }): JSX.Element {
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const [busy, setBusy] = useState(false)
  const entries = Object.entries(SLIDES)
  const fileNameOf = (key: string) => `${lang}_${SLIDES[key].fileName}`

  // Rendered once per language, so toggling `busy` does not re-render the
  // slides (and re-run every Fit measurement)
  const slides = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(SLIDES).map(([key, { Slide }]) => [
          key,
          <Slide key={key} t={getStoreText(lang)} lang={lang} />,
        ]),
      ),
    [lang],
  )

  const run = async (keys: string[]) => {
    setBusy(true)
    const failed: string[] = []
    try {
      for (const key of keys) {
        const root = refs.current[key]
        if (!root) continue
        // Keep exporting the other slides when one fails
        try {
          await exportSlide(root, fileNameOf(key))
        } catch (e) {
          console.error(`Failed to export ${fileNameOf(key)}`, e)
          failed.push(fileNameOf(key))
        }
      }
    } finally {
      setBusy(false)
    }
    if (failed.length > 0) {
      alert(`Failed to export: ${failed.join(", ")}`)
    }
  }

  return (
    <main className={css.gallery}>
      <div className={css.header}>
        <h1 className={css.title}>Chrome Web Store images ({lang})</h1>
        <button
          type="button"
          className={css.button}
          disabled={busy}
          onClick={() => run(entries.map(([key]) => key))}
        >
          Export all
        </button>
      </div>
      <ol className={css.list}>
        {entries.map(([key, { title }]) => (
          <li key={key}>
            <div className={css.caption}>
              <a href={`/${lang}/store-image/${key}`}>
                {key}. {title}
              </a>
              <button
                type="button"
                className={css.button}
                disabled={busy}
                onClick={() => run([key])}
              >
                Export {fileNameOf(key)}
              </button>
            </div>
            <div className={css.frame}>
              <div
                className={css.scaled}
                ref={(el) => {
                  refs.current[key] = el
                }}
              >
                {slides[key]}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
