import type { AtRule, PluginCreator } from "postcss"

const DEFAULT_PREFIX = "--tw-"
const LAYER_NAME = "properties"

type Options = {
  /** Only custom properties starting with this prefix are handled. */
  prefix?: string
}

/**
 * PostCSS plugin that makes `@property`-based custom properties work inside
 * Shadow DOM.
 *
 * Tailwind CSS v4 registers the initial values of its internal custom
 * properties (e.g. `--tw-shadow`, `--tw-translate-x`) with `@property`.
 * Chrome ignores `@property` rules inside a shadow tree, so utilities that rely
 * on those initial values (shadow, ring, transform, gradient, blur, ...) break
 * in the content script UI.
 *
 * This plugin declares the same initial values as regular custom properties in
 * a low-priority cascade layer. The declarations live only in the stylesheet
 * that is injected into the shadow root, so nothing leaks into the user's page
 * (unlike registering `@property` on the document).
 */
const shadowDomProperties: PluginCreator<Options> = (opts = {}) => {
  const prefix = opts.prefix ?? DEFAULT_PREFIX

  return {
    postcssPlugin: "shadow-dom-properties",
    OnceExit(root, { Rule, AtRule }) {
      // Non-inherited properties must be declared on every element,
      // inherited ones only once on the shadow host (and the document root
      // for extension pages) so that they still inherit as registered.
      const nonInherited = new Map<string, string>()
      const inherited = new Map<string, string>()

      root.walkAtRules("property", (atRule: AtRule) => {
        const name = atRule.params.trim()
        if (!name.startsWith(prefix)) return

        let initialValue: string | undefined
        let inherits = false
        atRule.walkDecls((decl) => {
          if (decl.prop === "initial-value") initialValue = decl.value
          if (decl.prop === "inherits") inherits = decl.value.trim() === "true"
        })
        // Without an initial value the property starts as the guaranteed-invalid
        // value, which is the same as leaving it undeclared.
        if (initialValue === undefined) return

        const target = inherits ? inherited : nonInherited
        target.set(name, initialValue)
      })

      if (nonInherited.size === 0 && inherited.size === 0) return

      const layer = new AtRule({ name: "layer", params: LAYER_NAME })
      if (inherited.size > 0) {
        const rule = new Rule({ selector: ":host, :root" })
        inherited.forEach((value, prop) => rule.append({ prop, value }))
        layer.append(rule)
      }
      if (nonInherited.size > 0) {
        const rule = new Rule({
          selector: ":host, *, ::before, ::after, ::backdrop",
        })
        nonInherited.forEach((value, prop) => rule.append({ prop, value }))
        layer.append(rule)
      }
      root.append(layer)
    },
  }
}
shadowDomProperties.postcss = true

export default shadowDomProperties
