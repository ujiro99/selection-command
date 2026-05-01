import type { Plugin } from "vite"
import type { OutputAsset } from "rollup"
import fs from "node:fs"

export default function removeCssFromContentScript(): Plugin {
  return {
    name: "update-manifest",
    writeBundle(_options, bundle) {
      const b = Object.entries(bundle).find(
        ([name]) => name === "manifest.json",
      )

      if (!b) return
      try {
        const src = (b[1] as unknown as OutputAsset).source
        const manifest = JSON.parse(src as string)
        const { content_scripts } = manifest
        if (!content_scripts) return
        // Remove the css field from all content_script entries.
        // crxjs automatically adds CSS imports as manifest css[], but Chrome
        // injects those into the page document (not Shadow DOM), breaking page styles.
        // Both content_script.tsx and command_hub.tsx inject CSS manually into
        // their Shadow roots, so manifest-level CSS injection must be suppressed.
        for (const cs of content_scripts) {
          delete cs.css
        }

        // write
        fs.writeFileSync(
          `./dist/manifest.json`,
          JSON.stringify(manifest, null, 2),
        )
      } catch (e) {
        console.error(e)
      }
    },
  }
}
