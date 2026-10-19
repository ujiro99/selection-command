import postcss from "postcss"

export type RemUsage = {
  selector: string
  prop: string
  value: string
}

// Matches a length in rem units, e.g. "1rem", ".5rem", "-0.25rem".
const REM_PATTERN = /(?:^|[^\w.-])-?(?:\d+\.?\d*|\.\d+)rem\b/

/**
 * Returns every declaration that uses `rem` units.
 *
 * `rem` is relative to the font-size of the document root, so inside the
 * content script's Shadow DOM it depends on the user's page. The content
 * script CSS must not use it (see docs/design/tailwindcss-v4-migration.md).
 * Media / container query conditions are not declarations and are therefore
 * not reported: `rem` there is based on the browser's initial font-size, not
 * on the page.
 */
export function findRemUsages(css: string): RemUsage[] {
  const usages: RemUsage[] = []
  postcss.parse(css).walkDecls((decl) => {
    if (!REM_PATTERN.test(decl.value)) return
    const parent = decl.parent
    const selector =
      parent?.type === "rule"
        ? (parent as postcss.Rule).selector
        : parent?.type === "atrule"
          ? `@${(parent as postcss.AtRule).name} ${(parent as postcss.AtRule).params}`
          : ""
    usages.push({ selector, prop: decl.prop, value: decl.value })
  })
  return usages
}
