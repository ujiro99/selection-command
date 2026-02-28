import type { Plugin } from "vite"

const VIRTUAL_MODULE_ID = "@import-if"
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

type ImportIfOptions = {
  mode: string
}

// Custom vite plugin to provide compile-time conditional import based on build mode.
// Replaces vite-plugin-macro's importIf functionality.
export function importIfPlugin({ mode }: ImportIfOptions): Plugin[] {
  return [
    {
      name: "vite-plugin-import-if",
      enforce: "pre",
      resolveId(id) {
        if (id === VIRTUAL_MODULE_ID) {
          return RESOLVED_VIRTUAL_MODULE_ID
        }
      },
      load(id) {
        if (id === RESOLVED_VIRTUAL_MODULE_ID) {
          // Provide a stub; the actual transformation is done in the transform hook
          return `export function importIf(_targetMode, _path) {}`
        }
      },
      transform(code, id) {
        if (id.includes("node_modules") || !code.includes("importIf")) {
          return null
        }

        let transformed = code

        // Replace importIf("mode", "path") calls with actual import or remove them
        // Pattern: optional indent, importIf("targetMode", "importPath"), optional semicolon/newline
        transformed = transformed.replace(
          /^(?<indent>[ \t]*)importIf\s*\(\s*["'](?<targetMode>[^"']+)["']\s*,\s*["'](?<importPath>[^"']+)["']\s*\)\s*;?\n?/gm,
          (_, _indent, targetMode, importPath) => {
            return mode === targetMode ? `import "${importPath}"\n` : ""
          },
        )

        if (transformed !== code) {
          return { code: transformed, map: null }
        }
        return null
      },
    },
  ]
}
