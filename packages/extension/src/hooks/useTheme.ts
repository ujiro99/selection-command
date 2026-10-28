import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react"
import { THEME, THEME_ATTRIBUTE } from "@/const"
import { useUserSettings } from "@/hooks/useSettings"

const QUERY = "(prefers-color-scheme: dark)"

/**
 * localStorage key caching the resolved theme of the extension pages, so the
 * next page load can apply it synchronously before the settings are loaded.
 */
export const THEME_CACHE_KEY = "selectionCommand.theme"

export type ResolvedTheme = "light" | "dark"

const isResolvedTheme = (value: unknown): value is ResolvedTheme =>
  value === "light" || value === "dark"

/**
 * The resolved theme, provided by the root that calls useTheme. Lets deeply
 * nested components (e.g. every menu icon) read it without each one loading
 * the settings.
 * Outside a provider it silently falls back to "light", so every new entry
 * point (e.g. a side panel) must provide it from its own useTheme call.
 */
export const themeContext = createContext<ResolvedTheme>("light")

export const useThemeContext = (): ResolvedTheme => useContext(themeContext)

// Tracks the OS / browser level color scheme preference.
export function usePrefersDarkScheme(): boolean {
  const [prefersDark, setPrefersDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setPrefersDark(mql.matches)
    // Sync in case the preference changed before the listener was attached.
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return prefersDark
}

/**
 * Resolves the theme setting into the theme actually applied.
 * A missing setting (saved before the option existed) follows the system.
 */
export function resolveTheme(
  theme: THEME | undefined,
  prefersDark: boolean,
): ResolvedTheme {
  if (theme === THEME.LIGHT) return "light"
  if (theme === THEME.DARK) return "dark"
  return prefersDark ? "dark" : "light"
}

const readCachedTheme = (): ResolvedTheme | null => {
  try {
    const value = localStorage.getItem(THEME_CACHE_KEY)
    return isResolvedTheme(value) ? value : null
  } catch {
    return null
  }
}

const writeCachedTheme = (theme: ResolvedTheme) => {
  try {
    localStorage.setItem(THEME_CACHE_KEY, theme)
  } catch {
    // The cache only avoids a flash on the next load, so ignore failures.
  }
}

/**
 * Applies the theme to the document root before React renders, from the
 * cache of the last resolved theme or else the system preference.
 * Without it, components measuring layout in their layout effects (e.g. the
 * Radix Switch) force a style calculation before useTheme sets the
 * attribute, and controls with color transitions then fade from the light
 * colors to the dark ones.
 * Call it in the entry of every extension page that calls useTheme on the
 * document root.
 */
export function applyInitialTheme(): void {
  const theme =
    readCachedTheme() ?? (window.matchMedia(QUERY).matches ? "dark" : "light")
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme)
}

/**
 * Sets the theme attribute with transitions disabled, so that controls with
 * color transitions switch at once instead of fading between the themes.
 */
const setThemeAttribute = (target: Element, theme: ResolvedTheme) => {
  if (target.getAttribute(THEME_ATTRIBUTE) === theme) return

  const style = document.createElement("style")
  style.textContent =
    "*,*::before,*::after{transition:none!important}"
  // A stylesheet in the document does not reach into a shadow tree.
  const container = target.shadowRoot ?? document.head
  container.appendChild(style)

  target.setAttribute(THEME_ATTRIBUTE, theme)

  // Force a style calculation with the new theme while transitions are
  // disabled, then restore them.
  window.getComputedStyle(target).getPropertyValue("color")
  setTimeout(() => style.remove(), 1)
}

/**
 * Applies the user's theme to `target` via the THEME_ATTRIBUTE attribute,
 * which the `dark:` variant and the dark color tokens are keyed on.
 * Pass the document root for extension pages, or the shadow host for the
 * content script.
 */
export function useTheme(target: Element | null | undefined): ResolvedTheme {
  const { userSettings, loading } = useUserSettings()
  const prefersDark = usePrefersDarkScheme()
  const resolved = resolveTheme(userSettings.theme, prefersDark)

  // While the settings are loading, keep the theme already applied (see
  // applyInitialTheme) instead of switching to the system one meanwhile.
  const applied = target?.getAttribute(THEME_ATTRIBUTE)
  const theme = loading && isResolvedTheme(applied) ? applied : resolved

  // Layout effect: set the attribute before the first paint, so `dark:`
  // styles never render a light frame first.
  // The attribute is intentionally not removed on cleanup: StrictMode's
  // double effect invocation would otherwise leave it unset while the
  // children's layout effects run, which reintroduces the light styles.
  useLayoutEffect(() => {
    if (target == null) return
    setThemeAttribute(target, theme)
    // Only the extension pages cache the theme; the content script's
    // localStorage belongs to the web page.
    if (!loading && target === document.documentElement) {
      writeCachedTheme(theme)
    }
  }, [target, theme, loading])

  return theme
}
