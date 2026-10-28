/*
 * Applies the theme to the document root while the HTML is parsed, before
 * the first paint. Manifest V3 forbids inline scripts, so this is a classic
 * (render-blocking) script loaded from the extension itself.
 * It reads the theme that useTheme cached in localStorage, or else follows
 * the system preference. Keep the key in sync with THEME_CACHE_KEY in
 * src/hooks/useTheme.ts.
 */
;(function () {
  let theme = null
  try {
    theme = localStorage.getItem("selectionCommand.theme")
  } catch {
    // Fall back to the system preference.
  }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }
  document.documentElement.setAttribute("data-sc-theme", theme)
})()
