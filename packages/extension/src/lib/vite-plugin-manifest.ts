import type { Plugin } from "vite"
import type { OutputAsset } from "rollup"
import fs from "node:fs"
import path from "node:path"
import { CONTENT_SCRIPT_CSS_PLACEHOLDER } from "./contentScriptCss"
import { findRemUsages } from "./findRemUsages"

// Swaps the CONTENT_SCRIPT_CSS_PLACEHOLDER array literal embedded in the
// built JS for the real content_script CSS file list. The list isn't known
// until crxjs finishes hashing chunks, so it can't be supplied via Vite's
// `define` directly - instead we patch it into whichever emitted chunk
// contains the placeholder, the same way vite-plugin-pwa injects its
// `self.__WB_MANIFEST` precache list.
// The content script UI lives in the user's page, where `rem` follows the
// page's root font-size. Fail the build if any content script CSS uses it, so
// the UI never changes with the page (see
// docs/design/tailwindcss-v4-migration.md).
function assertNoRemInCss(distDir: string, cssFiles: string[]) {
  // An empty list means the manifest could not be processed. Fail instead of
  // silently skipping the check.
  if (cssFiles.length === 0) {
    throw new Error("No content script CSS files found to check for rem units")
  }
  const errors: string[] = []
  for (const file of cssFiles) {
    const css = fs.readFileSync(path.join(distDir, file), "utf-8")
    for (const { selector, prop, value } of findRemUsages(css)) {
      errors.push(`  ${file}: ${selector} { ${prop}: ${value} }`)
    }
  }
  if (errors.length > 0) {
    throw new Error(
      `Content script CSS must not use rem units:\n${errors.join("\n")}`,
    )
  }
}

function injectContentScriptCssFiles(distDir: string, cssFiles: string[]) {
  const assetsDir = path.join(distDir, "assets")
  const placeholderPattern = new RegExp(
    `\\[\\s*["']${CONTENT_SCRIPT_CSS_PLACEHOLDER}["']\\s*\\]`,
  )
  for (const fileName of fs.readdirSync(assetsDir)) {
    if (!fileName.endsWith(".js")) continue
    const filePath = path.join(assetsDir, fileName)
    const code = fs.readFileSync(filePath, "utf-8")
    if (!placeholderPattern.test(code)) continue
    fs.writeFileSync(
      filePath,
      code.replace(placeholderPattern, JSON.stringify(cssFiles)),
    )
  }
}

export default function removeCssFromContentScript(): Plugin {
  return {
    name: "update-manifest",
    writeBundle(_options, bundle) {
      const b = Object.entries(bundle).find(
        ([name]) => name === "manifest.json",
      )

      if (!b) return
      let contentScriptCssFiles: string[] = []
      try {
        const src = (b[1] as unknown as OutputAsset).source
        const manifest = JSON.parse(src as string)
        const { content_scripts } = manifest
        if (!content_scripts) throw new Error("content_scripts not found")
        // Remove the css field from all content_script entries.
        // crxjs automatically adds CSS imports as manifest css[], but Chrome
        // injects those into the page document (not Shadow DOM), breaking page styles.
        // content_script.tsx injects CSS manually into its Shadow root, so
        // manifest-level CSS injection must be suppressed.
        for (const cs of content_scripts) {
          // content_script.tsx's own CSS graph can be split across multiple
          // chunks (e.g. shared components also used by other entry points
          // end up in separate, content-hashed CSS files). Hand the exact
          // list crxjs computed to content_script.tsx by patching it into
          // the built bundle, instead of relying on hardcoded, hash-fragile
          // filenames.
          if (
            cs.css &&
            cs.js?.some((f: string) => f.includes("content_script.tsx"))
          ) {
            injectContentScriptCssFiles("./dist", cs.css)
            contentScriptCssFiles = cs.css
          }
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

      // Checked outside the try block above so that a violation fails the
      // build. It also fails when the manifest could not be processed.
      assertNoRemInCss("./dist", contentScriptCssFiles)
    },
  }
}
