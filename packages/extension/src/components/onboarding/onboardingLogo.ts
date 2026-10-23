import { useThemeContext } from "@/hooks/useTheme"

const LOGO_URL = chrome.runtime.getURL("SelectionCommandLogo.png")
// The same logo with the wordmark's lightness inverted (hue kept) and the
// icon untouched, since the original's dark text vanishes on a dark page.
const LOGO_DARK_URL = chrome.runtime.getURL("SelectionCommandLogo_dark.png")

/** Returns the logo image URL for the current theme. */
export const useLogoUrl = (): string =>
  useThemeContext() === "dark" ? LOGO_DARK_URL : LOGO_URL
