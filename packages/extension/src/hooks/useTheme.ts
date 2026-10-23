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

export type ResolvedTheme = "light" | "dark"

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

/**
 * Applies the user's theme to `target` via the THEME_ATTRIBUTE attribute,
 * which the `dark:` variant and the dark color tokens are keyed on.
 * Pass the document root for extension pages, or the shadow host for the
 * content script.
 */
export function useTheme(target: Element | null | undefined): ResolvedTheme {
  const { userSettings } = useUserSettings()
  const prefersDark = usePrefersDarkScheme()
  const resolved = resolveTheme(userSettings.theme, prefersDark)

  // Layout effect: set the attribute before the first paint, so `dark:`
  // styles never render a light frame first.
  useLayoutEffect(() => {
    if (target == null) return
    target.setAttribute(THEME_ATTRIBUTE, resolved)
    return () => target.removeAttribute(THEME_ATTRIBUTE)
  }, [target, resolved])

  return resolved
}
