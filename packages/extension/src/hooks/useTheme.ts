import { useEffect, useState } from "react"
import { THEME, THEME_ATTRIBUTE } from "@/const"
import { useUserSettings } from "@/hooks/useSettings"

const QUERY = "(prefers-color-scheme: dark)"

export type ResolvedTheme = "light" | "dark"

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

  useEffect(() => {
    if (target == null) return
    target.setAttribute(THEME_ATTRIBUTE, resolved)
  }, [target, resolved])

  return resolved
}
