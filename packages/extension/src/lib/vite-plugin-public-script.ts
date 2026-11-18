import type { Plugin } from "vite"
import fs from "node:fs"
import path from "node:path"

/**
 * Serves classic scripts in public/ as modules on the dev server.
 *
 * In dev mode, CRXJS rewrites every `<script src>` of an extension page into
 * a dynamic `import()` (when the page has inline scripts, e.g. the React
 * preamble), and Vite refuses to import files in public/. The build copies
 * them as-is, so this only applies to `vite serve`.
 *
 * @param scripts Paths of the scripts as referenced from HTML, e.g. "/foo.js".
 */
export default function publicScript(scripts: string[]): Plugin {
  let publicDir = ""
  return {
    name: "public-script",
    apply: "serve",
    configResolved(config) {
      publicDir = config.publicDir
    },
    load(id) {
      // Drop the cache-busting query CRXJS appends, e.g. "?t=123".
      const url = id.split("?")[0]
      if (!scripts.includes(url)) return null
      return fs.readFileSync(path.join(publicDir, url), "utf-8")
    },
  }
}
