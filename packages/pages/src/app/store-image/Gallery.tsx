"use client"

import { useRef, useState } from "react"
import { toPng } from "html-to-image"

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

/** All store images at 50%, with PNG export buttons. */
export function Gallery(): JSX.Element {
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const [busy, setBusy] = useState(false)
  const entries = Object.entries(SLIDES)

  const run = async (keys: string[]) => {
    setBusy(true)
    try {
      for (const key of keys) {
        const root = refs.current[key]
        if (root) await exportSlide(root, SLIDES[key].fileName)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={css.gallery}>
      <div className={css.header}>
        <h1 className={css.title}>Chrome Web Store images</h1>
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
        {entries.map(([key, { title, fileName, Slide }]) => (
          <li key={key}>
            <div className={css.caption}>
              <a href={`/store-image/${key}`}>
                {key}. {title}
              </a>
              <button
                type="button"
                className={css.button}
                disabled={busy}
                onClick={() => run([key])}
              >
                Export {fileName}
              </button>
            </div>
            <div className={css.frame}>
              <div
                className={css.scaled}
                ref={(el) => {
                  refs.current[key] = el
                }}
              >
                <Slide />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
