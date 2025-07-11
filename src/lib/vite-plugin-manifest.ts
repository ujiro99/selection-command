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
        const cn = content_scripts.find((cs: any) =>
          cs.js.some((file: string) => file.match(/content_script.tsx/)),
        )
        if (!cn) return
        delete cn.css

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
